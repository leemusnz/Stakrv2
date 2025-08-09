# AI Analyzer Dev Tools

Comprehensive development tools for fine-tuning and testing the AI Challenge Analyzer.

## Features

### 1. UI Controls (Development Mode Only)
- **Behavior Sliders**: Context Awareness, Verbosity Level, Critical Level
- **Challenge Type Presets**: Physical Skills, Habits, Learning, Fitness Tracking, Creative
- **Feature Toggles**: Skip obvious questions, verification optimization, risk analysis
- **Advanced Settings**: Custom prompt additions, confidence thresholds, response formats
- **Real-time Testing**: Test analyzer with current challenge data

### 2. URL Parameter Overrides
Quick testing without UI interaction:

```
# Quick modes
/create-challenge?analyzer_quick=true       # Fast, minimal analysis
/create-challenge?analyzer_debug=true       # Detailed, verbose analysis

# Challenge-specific presets
/create-challenge?preset=physical_skills&context=90&skip_obvious=true
/create-challenge?preset=habits&verbosity=40
/create-challenge?preset=learning&context=80

# Fine-tuning parameters
/create-challenge?context=95&verbosity=30&critical=80&format=minimal
```

### 3. Challenge Type Presets

**Physical Skills** (`preset=physical_skills`)
- Optimized for handstands, gymnastics, technique-based activities
- High context awareness (skips obvious equipment questions)
- Focuses on technique, measurement, safety

**Habits** (`preset=habits`)
- For daily habits like brushing teeth, journaling, meditation
- Focuses on completion definitions, timing, quality standards
- Skips obvious equipment and location requirements

**Learning** (`preset=learning`)
- For skill development like guitar, languages, reading
- Focuses on progress measurement, practice quality
- Includes demonstration requirements

**Fitness Tracking** (`preset=fitness_tracking`)
- For measurable fitness activities
- Emphasizes auto-sync capabilities
- Focuses on accuracy, weather policies

**Creative** (`preset=creative`)
- For creative/productive challenges
- Focuses on quality standards, originality
- Addresses submission formats

## URL Parameters Reference

| Parameter | Values | Description |
|-----------|--------|-------------|
| `context` | 0-100 | Context awareness level (higher = skip more obvious questions) |
| `verbosity` | 0-100 | Analysis detail level (higher = more detailed) |
| `critical` | 0-100 | Critical analysis level (higher = more strict) |
| `preset` | physical_skills, habits, learning, fitness_tracking, creative | Challenge type preset |
| `format` | minimal, standard, detailed | Response format |
| `skip_obvious` | true/false | Skip obvious questions |
| `verification` | true/false | Include verification optimization |
| `risk` | true/false | Include risk analysis |
| `design` | true/false | Include design recommendations |
| `custom_prompt` | string | Custom prompt additions (URL encoded) |

## Quick Testing Examples

### For Handstand Challenge
```
/create-challenge?preset=physical_skills&context=90&skip_obvious=true
```

### For Habit Tracking
```
/create-challenge?preset=habits&context=85&verbosity=40
```

### Minimal Analysis Mode
```
/create-challenge?format=minimal&context=100&skip_obvious=true
```

### Debug Mode (Verbose Everything)
```
/create-challenge?analyzer_debug=true
```

## Implementation Notes

- URL parameters take precedence over UI settings
- Settings are automatically saved to localStorage
- Dev tools only appear in development mode
- All settings are optional and fall back to sensible defaults
- Console logging shows applied dev settings

## Usage Tips

1. **Start with presets** for your challenge type
2. **Fine-tune with sliders** for specific needs
3. **Use URL params** for quick iteration testing
4. **Check console logs** to verify settings are applied
5. **Test edge cases** with different parameter combinations

