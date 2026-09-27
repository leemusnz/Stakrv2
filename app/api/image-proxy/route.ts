import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Proxies a PRIVATE verification-files bucket — never serve to anonymous
    // callers. Every key must also belong to the requesting user.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");
    const version = searchParams.get("v") || "default";

    if (imageUrl === null) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }
    if (imageUrl.trim() === "") {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }

    // Only allow S3 URLs from our bucket for security
    if (
      !imageUrl.includes(
        "stakr-verification-files.s3.ap-southeast-2.amazonaws.com",
      )
    ) {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }

    // Reject attempts to traverse via query path components like ?/../../../
    const decodedUrl = decodeURIComponent(imageUrl);
    if (/\?\//.test(decodedUrl)) {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }

    // Extract the S3 key from the URL
    const urlParts = imageUrl.split(".amazonaws.com/");
    if (urlParts.length !== 2) {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }
    // Sanitize query fragments and null-byte injections
    let s3Key = decodeURIComponent(urlParts[1]);
    s3Key = s3Key.replace(/\?.*$/, ""); // drop any query string
    s3Key = s3Key.replace(/\u0000|%00/g, ""); // remove null bytes
    s3Key = s3Key.replace(/\n.*/g, ""); // drop header injection via newlines
    if (!s3Key || /\.\./.test(s3Key) || /\\/.test(s3Key)) {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }

    const db = createDbConnection();
    const allowed =
      await db`SELECT file_key,storage_key FROM proof_uploads WHERE file_key=${s3Key} AND user_id=${session.user.id}`;
    if (!allowed[0])
      return NextResponse.json(
        { error: "Evidence is private" },
        { status: 403 },
      );
    s3Key = allowed[0].storage_key;

    // Configure S3 client with credentials
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-southeast-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Get the object from S3 using authenticated request
    const command = new GetObjectCommand({
      Bucket: "stakr-verification-files",
      Key: s3Key,
    });

    let response;
    try {
      response = await s3Client.send(command);
    } catch (err: unknown) {
      const errorName =
        typeof err === "object" && err !== null && "name" in err
          ? String((err as any).name)
          : undefined;
      if (errorName === "NoSuchKey") {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 500 },
      );
    }

    if (!response.Body) {
      console.error("❌ No body in S3 response");
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const bodyArray = await response.Body.transformToByteArray();
    const imageBuffer = new Uint8Array(bodyArray);

    const contentType = response.ContentType || "image/png";

    // Return the image with proper headers and cache busting
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        // Private evidence must never enter a shared CDN cache.
        "Cache-Control": "private, no-store",
        ETag: `"${version}-${Date.now()}"`, // Cache busting ETag
        "Last-Modified": new Date().toUTCString(),
        Vary: "Accept-Encoding", // Vary by encoding for better caching
      },
    });
  } catch (error) {
    console.error("❌ Image proxy error:", error);
    return NextResponse.json({ error: "Image proxy failed" }, { status: 500 });
  }
}
