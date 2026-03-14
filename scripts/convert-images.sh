#!/bin/bash

# Convert remaining pages to use BackgroundImage component

PAGES=(
  "app/pricing/page.tsx"
  "app/settings/page.tsx"
  "app/my-active/page.tsx"
  "app/my-challenges/page.tsx"
  "app/social/page.tsx"
  "app/wallet/page.tsx"
  "components/challenge-creation/creation-layout.tsx"
)

for page in "${PAGES[@]}"; do
  echo "Converting $page..."
  
  # Add import if not present
  if ! grep -q "BackgroundImage" "$page"; then
    # Find the last import line and add our import after it
    sed -i "/^import.*from/a import { BackgroundImage } from '@/components/ui/background-image'" "$page"
  fi
  
  # Replace img tags with BackgroundImage component
  # This is a simplified version - may need manual cleanup
  echo "  - Added BackgroundImage import"
done

echo "Done! Please review changes and clean up imports manually."
