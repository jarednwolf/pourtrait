# Drinking Window Data Sources & Methodology

## Overview

The AI Wine Sommelier uses a **hybrid approach** for calculating drinking windows, combining expert-curated data with algorithmic calculations to provide the most accurate recommendations possible.

## Data Source Hierarchy

The system prioritizes data sources in the following order:

### 1. External Wine Database Data (Highest Priority)
- **Source**: Wine APIs, professional databases
- **Confidence**: 90%
- **Usage**: When `wine.externalData.agingPotential` is available
- **Examples**: Wine Spectator API, Vivino API, CellarTracker data

### 2. Expert-Curated Data (High Priority)
- **Source**: Wine industry experts and publications
- **Confidence**: 70-95% (varies by source)
- **Usage**: Specific producer/wine matches, regional patterns, varietal patterns
- **Sources**: 
  - Wine Spectator
  - Robert Parker ratings
  - Jancis Robinson
  - Decanter Magazine

### 3. Algorithmic Calculation (Fallback)
- **Source**: Rule-based system
- **Confidence**: 60%
- **Usage**: When no expert data is available
- **Based on**: Wine type, region, vintage, basic heuristics

## Expert Data Categories

### Specific Producer Data
High-confidence data for renowned producers:

```typescript
{
  producer: 'Château Margaux',
  region: 'Margaux',
  drinkingWindow: { earliest: 8, peakStart: 15, peakEnd: 35, latest: 50 },
  source: 'Wine Spectator',
  confidence: 0.95
}
```

### Regional Patterns
General aging patterns for wine regions:

```typescript
'Bordeaux': { 
  baseAging: 12, 
  peakRatio: { start: 0.4, end: 0.8 }, 
  confidence: 0.9 
}
```

### Varietal Characteristics
Grape-specific aging patterns:

```typescript
'Cabernet Sauvignon': { 
  baseAging: 10, 
  peakRatio: { start: 0.3, end: 0.7 }, 
  confidence: 0.8 
}
```

## Current Expert Data Coverage

### Regions Covered
- **France**: Bordeaux, Burgundy, Champagne, Rhône Valley
- **Italy**: Barolo, Brunello di Montalcino, Chianti Classico
- **USA**: Napa Valley, Sonoma, Willamette Valley
- **Germany**: Mosel, Rheingau
- **Spain**: Rioja, Ribera del Duero

### Producers Covered
- Château Margaux, Château Latour (Bordeaux)
- Domaine de la Romanée-Conti (Burgundy)
- Dom Pérignon (Champagne)
- Plus regional and varietal patterns

### Varietals Covered
- **Red**: Cabernet Sauvignon, Merlot, Pinot Noir, Syrah, Nebbiolo, Sangiovese, Tempranillo
- **White**: Chardonnay, Riesling, Sauvignon Blanc, Chenin Blanc

## Data Source Transparency

Users can see which data source was used for their wine's drinking window:

- **Expert Data**: Shows source (e.g., "Expert data: Wine Spectator") with high confidence
- **Regional Pattern**: Shows "Regional pattern" with medium-high confidence
- **Varietal Pattern**: Shows "Varietal pattern" with medium confidence
- **Algorithmic**: Shows "Algorithmic calculation" with lower confidence

## Confidence Scoring

The system provides confidence scores to help users understand reliability:

- **95%**: Specific expert data from top-tier sources
- **90%**: External wine database data
- **85%**: Regional expert patterns
- **80%**: Varietal expert patterns
- **75%**: Regional algorithmic adjustments
- **60%**: Basic algorithmic calculation

## Future Enhancements

### Planned Data Sources
1. **Wine API Integration**: Vivino, Wine.com, CellarTracker APIs
2. **Professional Reviews**: Automated parsing of wine reviews
3. **User Feedback**: Learning from consumption patterns
4. **Vintage Variations**: Year-specific adjustments
5. **Producer Tiers**: Classification-based aging potential

### Machine Learning Integration
- **Pattern Recognition**: Learning from expert data patterns
- **User Preference Learning**: Adapting to individual taste preferences
- **Vintage Quality Adjustments**: Incorporating vintage ratings
- **Regional Climate Impact**: Weather pattern influences

## Data Quality Assurance

### Expert Data Validation
- Cross-reference multiple expert sources
- Regular updates from wine publications
- Confidence scoring based on source reliability
- Outlier detection and validation

### Algorithmic Validation
- Comparison with expert data for accuracy
- Regular calibration against known wines
- User feedback integration
- Continuous improvement based on consumption data

## Implementation Details

### Data Structure
```typescript
interface ExpertDrinkingWindowData {
  producer: string
  wine?: string
  vintage?: number
  region: string
  varietal?: string[]
  drinkingWindow: {
    earliest: number
    peakStart: number
    peakEnd: number
    latest: number
  }
  source: string
  confidence: number
}
```

### Lookup Algorithm
1. Try exact producer + region match
2. Try region + varietal match
3. Try region-only match
4. Fall back to regional patterns
5. Fall back to varietal patterns
6. Use algorithmic calculation

## Benefits of Hybrid Approach

### Accuracy
- **High-end wines**: Expert data provides precise aging curves
- **Common wines**: Regional/varietal patterns offer good guidance
- **Unknown wines**: Algorithmic fallback ensures coverage

### Transparency
- Users know the data source and confidence level
- Expert recommendations clearly identified
- Algorithmic calculations acknowledged as estimates

### Scalability
- Expert data covers premium wines and regions
- Patterns extend coverage to similar wines
- Algorithms handle edge cases and new wines

### Continuous Improvement
- Expert data can be expanded over time
- User feedback improves algorithmic calculations
- Machine learning can identify new patterns

## Conclusion

The hybrid approach ensures that users get the most accurate drinking window recommendations possible, with transparency about data sources and confidence levels. Premium wines benefit from expert knowledge, while the system gracefully handles any wine through pattern matching and algorithmic fallbacks.