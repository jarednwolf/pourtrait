# Drinking Window Tracking System

## Overview

The Drinking Window Tracking System is a sophisticated feature that helps users understand when their wines are at their optimal drinking condition. It combines expert wine knowledge with intelligent algorithms to provide accurate, transparent recommendations about wine readiness.

## Key Features

### 🎯 Hybrid Data Approach
- **Expert-Curated Data**: Wine Spectator, Robert Parker, Jancis Robinson, Decanter
- **External Wine Databases**: Integration with professional wine APIs
- **Algorithmic Fallback**: Intelligent calculations for unknown wines
- **Transparent Sourcing**: Users always know the data source and confidence level

### 📊 Visual Indicators
- **Status Badges**: Professional indicators without emojis
- **Timeline Visualization**: Shows current position in drinking window
- **Urgency Alerts**: Priority system for wines needing attention
- **Confidence Scoring**: Transparency about data reliability

### 🔔 Intelligent Notifications
- **Entering Peak**: Alerts when wines approach optimal drinking
- **Leaving Peak**: Priority alerts for wines past their prime
- **Over-the-Hill**: Critical alerts for wines that should be consumed immediately
- **Email Integration**: High-priority alerts sent via email

## Technical Implementation

### Data Source Hierarchy

1. **External Wine Database Data** (90-95% confidence)
   ```typescript
   wine.externalData.agingPotential // From wine APIs
   ```

2. **Expert-Curated Data** (70-95% confidence)
   ```typescript
   // Specific producer data
   {
     producer: 'Château Margaux',
     region: 'Margaux',
     drinkingWindow: { earliest: 8, peakStart: 15, peakEnd: 35, latest: 50 },
     source: 'Wine Spectator',
     confidence: 0.95
   }
   ```

3. **Regional Patterns** (75-90% confidence)
   ```typescript
   'Bordeaux': { 
     baseAging: 12, 
     peakRatio: { start: 0.4, end: 0.8 }, 
     confidence: 0.9 
   }
   ```

4. **Varietal Characteristics** (70-80% confidence)
   ```typescript
   'Cabernet Sauvignon': { 
     baseAging: 10, 
     peakRatio: { start: 0.3, end: 0.7 }, 
     confidence: 0.8 
   }
   ```

5. **Algorithmic Calculation** (60% confidence)
   - Rule-based system for unknown wines
   - Based on wine type, region, vintage

### Core Services

#### DrinkingWindowService
```typescript
class DrinkingWindowService {
  static calculateDrinkingWindow(wine: Partial<Wine>): DrinkingWindow
  static updateDrinkingWindowStatus(drinkingWindow: DrinkingWindow): DrinkingWindow
  static getWinesNeedingAlerts(wines: Wine[]): DrinkingWindowAlerts
  static getDrinkingUrgencyScore(wine: Wine): number
  static getDrinkingWindowDataSource(wine: Partial<Wine>): DataSourceInfo
}
```

#### ExpertDrinkingWindowService
```typescript
class ExpertDrinkingWindowService {
  static findExpertData(wine: WineIdentifier): ExpertDrinkingWindowData | null
  static getRegionalPattern(region: string): RegionalAgingPattern | null
  static getVarietalPattern(varietals: string[]): VarietalAgingPattern | null
  static calculateExpertAgingPotential(wine: WineIdentifier): ExpertAgingResult | null
}
```

#### NotificationService
```typescript
class NotificationService {
  static generateDrinkingWindowAlerts(userId: string, wines: Wine[], settings: NotificationSettings): Promise<DrinkingWindowAlert[]>
  static createNotification(userId: string, alert: DrinkingWindowAlert): Promise<void>
  static sendEmailAlert(userEmail: string, alerts: DrinkingWindowAlert[]): Promise<void>
  static processAllUserAlerts(): Promise<void>
}
```

### UI Components

#### DrinkingWindowIndicator
- Professional status badges (Too Young, Ready, Peak, Declining, Past Prime)
- Timeline visualization showing current position
- Data source transparency with confidence indicators
- Responsive design for mobile and desktop

#### DrinkingWindowAlerts
- Dashboard showing wines needing attention
- Prioritized by urgency score
- Recent notifications display
- Summary statistics

#### DrinkingWindowSummary
- Collection overview by drinking window status
- Visual breakdown with percentages
- Quick insights into collection readiness

## Expert Data Coverage

### Regions
- **France**: Bordeaux, Burgundy, Champagne, Rhône Valley
- **Italy**: Barolo, Brunello di Montalcino, Chianti Classico
- **USA**: Napa Valley, Sonoma, Willamette Valley
- **Germany**: Mosel, Rheingau
- **Spain**: Rioja, Ribera del Duero

### Producers
- Château Margaux, Château Latour (Bordeaux)
- Domaine de la Romanée-Conti (Burgundy)
- Dom Pérignon (Champagne)
- Plus regional and varietal patterns

### Varietals
- **Red**: Cabernet Sauvignon, Merlot, Pinot Noir, Syrah, Nebbiolo, Sangiovese, Tempranillo
- **White**: Chardonnay, Riesling, Sauvignon Blanc, Chenin Blanc

## User Experience

### Status Indicators
- **Too Young**: Blue badge - "Wine needs more time to develop"
- **Ready to Drink**: Green badge - "Wine is ready to enjoy"
- **At Peak**: Emerald badge - "Optimal drinking window"
- **Declining**: Yellow badge - "Past peak but still enjoyable"
- **Past Prime**: Red badge - "Should be consumed soon"

### Urgency System
- **Critical (80-100)**: "Drink Soon!" - Red alert
- **High (60-79)**: "High Priority" - Orange alert
- **Medium (40-59)**: "Medium Priority" - Yellow alert
- **Low (0-39)**: No alert shown

### Data Source Transparency
Users always see:
- Which data source was used (Expert/Regional/Algorithmic)
- Confidence level of the recommendation
- Source attribution for expert data

## Integration Points

### Inventory Management
- Automatic drinking window calculation when wines are added
- Real-time status updates as wines age
- Integration with wine entry forms

### Recommendation Engine
- Prioritizes wines by drinking window urgency
- Considers readiness in pairing suggestions
- Enhances AI sommelier responses with timing advice

### Notification System
- Database-stored notifications
- Email alerts for high-priority wines
- User preference management

## Future Enhancements

### Planned Features
1. **Wine API Integration**: Vivino, Wine.com, CellarTracker APIs
2. **Machine Learning**: Pattern recognition from expert data
3. **Vintage Variations**: Year-specific adjustments
4. **User Feedback Learning**: Adapting to individual preferences
5. **Climate Impact**: Weather pattern influences on aging

### Data Expansion
- More expert sources and wine publications
- Expanded regional coverage
- Producer-specific aging curves
- Vintage quality adjustments

## Testing & Quality Assurance

### Comprehensive Test Suite
- **Unit Tests**: 18 test cases for DrinkingWindowService
- **Integration Tests**: 10 test cases for NotificationService
- **Expert Data Tests**: 13 test cases for ExpertDrinkingWindowService
- **Component Tests**: UI component functionality

### Data Validation
- Cross-reference multiple expert sources
- Confidence scoring based on source reliability
- Outlier detection and validation
- Regular calibration against known wines

## Performance Considerations

### Optimization Strategies
- Cached drinking window calculations
- Batch processing for status updates
- Efficient database queries with indexes
- Background processing for notifications

### Scalability
- Designed for millions of wines
- Efficient lookup algorithms
- Minimal database impact
- Asynchronous processing

## Conclusion

The Drinking Window Tracking System represents a sophisticated blend of expert wine knowledge and intelligent technology, providing users with accurate, transparent, and actionable information about when to enjoy their wines. The hybrid approach ensures both accuracy for premium wines and comprehensive coverage for any wine collection.