# Changelog

All notable changes to the Pourtrait AI Wine Sommelier project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Drinking Window Tracking System (Task 8)

#### 🎯 Hybrid Data Approach
- **Expert-Curated Data Integration**: Wine Spectator, Robert Parker, Jancis Robinson, Decanter
- **External Wine Database Support**: Ready for Vivino, Wine.com, CellarTracker APIs
- **Algorithmic Fallback**: Intelligent calculations for unknown wines
- **Data Source Transparency**: Users always see source and confidence level (60-95%)

#### 📊 Core Services
- **DrinkingWindowService**: Hybrid calculation engine with expert data priority
- **ExpertDrinkingWindowService**: Curated wine knowledge from industry experts
- **NotificationService**: Intelligent alert system with urgency prioritization
- **EnhancedWineService**: Automatic drinking window calculation for all wines

#### 🎨 Professional UI Components
- **DrinkingWindowIndicator**: Status badges without emojis (Too Young, Ready, Peak, Declining, Past Prime)
- **DrinkingWindowTimeline**: Visual timeline showing current position in drinking window
- **DrinkingWindowAlerts**: Priority dashboard for wines needing attention
- **DrinkingWindowSummary**: Collection overview with status breakdown
- **DrinkingUrgencyBadge**: Priority indicators for high-urgency wines

#### 🔔 Intelligent Notification System
- **Database-Stored Notifications**: Persistent notification management
- **Email Alert Integration**: High-priority alerts sent via email
- **Urgency Scoring**: 4-tier priority system (Critical, High, Medium, Low)
- **User Preference Management**: Customizable notification settings
- **Batch Processing**: Efficient alert generation for all users

#### 📈 Expert Data Coverage
- **Regions**: Bordeaux, Burgundy, Champagne, Barolo, Napa Valley, Mosel, Rioja, and more
- **Producers**: Château Margaux, Château Latour, Dom Pérignon, Domaine de la Romanée-Conti
- **Varietals**: Cabernet Sauvignon, Pinot Noir, Riesling, Chardonnay, Nebbiolo, and more
- **Confidence Levels**: 70-95% for expert data, 60% for algorithmic calculations

#### 🔗 System Integration
- **Inventory Dashboard**: Drinking window alerts prominently displayed
- **Wine Cards**: Status indicators and urgency badges on all wine displays
- **Enhanced Wine Entry**: Automatic drinking window calculation on wine addition
- **Recommendation Engine**: Drinking window urgency integrated into wine suggestions

#### 🧪 Comprehensive Testing
- **41 Test Cases**: Across 3 test files covering all core functionality
- **DrinkingWindowService Tests**: 18 test cases for calculation logic
- **NotificationService Tests**: 10 test cases for alert generation
- **ExpertDrinkingWindowService Tests**: 13 test cases for expert data lookup
- **100% Core Functionality Coverage**: All critical paths tested

#### 📚 Documentation
- **System Overview**: Comprehensive system documentation
- **Feature Documentation**: Detailed drinking window system guide
- **Data Sources Guide**: Explanation of hybrid approach and expert sources
- **API Documentation**: Complete service interface documentation
- **Design Document Updates**: Architecture and component specifications

#### 🔧 Technical Implementation
- **TypeScript**: Fully typed implementation with strict type checking
- **Professional Design**: No emojis, clean visual indicators
- **Performance Optimized**: Efficient algorithms and database queries
- **Scalable Architecture**: Designed for millions of wines
- **Error Handling**: Graceful degradation and comprehensive error management

### Technical Details

#### Data Source Hierarchy
1. **External Wine Database Data** (90-95% confidence)
2. **Expert-Curated Data** (70-95% confidence)
3. **Regional Patterns** (75-90% confidence)
4. **Varietal Characteristics** (70-80% confidence)
5. **Algorithmic Calculation** (60% confidence)

#### Expert Data Structure
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

#### Urgency Scoring System
- **Critical (80-100)**: Wines past their prime or leaving peak window soon
- **High (60-79)**: Wines approaching end of peak window
- **Medium (40-59)**: Wines in peak or ready status
- **Low (0-39)**: Young wines with time to develop

### Files Added
- `src/lib/services/drinking-window.ts` - Core drinking window calculation service
- `src/lib/services/expert-drinking-windows.ts` - Expert data service with curated wine knowledge
- `src/lib/services/notification-service.ts` - Intelligent notification and alert system
- `src/lib/services/wine-service-enhanced.ts` - Enhanced wine service with automatic calculations
- `src/lib/services/drinking-window-recommendations.ts` - Recommendation integration service
- `src/components/wine/DrinkingWindowIndicator.tsx` - Professional status indicators
- `src/components/wine/DrinkingWindowAlerts.tsx` - Alert dashboard and management
- `src/lib/services/__tests__/drinking-window.test.ts` - Comprehensive service tests
- `src/lib/services/__tests__/notification-service.test.ts` - Notification system tests
- `src/lib/services/__tests__/expert-drinking-windows.test.ts` - Expert data tests
- `docs/04-features/drinking-window-system.md` - Feature documentation
- `docs/drinking-window-data-sources.md` - Data sources and methodology guide
- `docs/SYSTEM_OVERVIEW.md` - Comprehensive system documentation

### Files Modified
- `src/components/wine/WineCard.tsx` - Added drinking window indicators
- `src/components/wine/InventoryDashboard.tsx` - Integrated drinking window alerts
- `src/app/inventory/page.tsx` - Enhanced wine service integration
- `src/components/wine/index.ts` - Exported new components
- `.kiro/specs/ai-wine-sommelier/design.md` - Updated with hybrid approach
- `.kiro/specs/ai-wine-sommelier/requirements.md` - Enhanced drinking window requirements
- `.kiro/specs/ai-wine-sommelier/tasks.md` - Updated task completion status

### Requirements Fulfilled
- ✅ **3.1**: Drinking window determination with hybrid expert/algorithmic approach
- ✅ **3.2**: Professional visual indicators for wine readiness status
- ✅ **3.3**: Comprehensive notification system with database storage and email alerts
- ✅ **3.4**: Priority alerts with urgency scoring for wines approaching end of window
- ✅ **3.5**: Full integration with recommendation logic and confidence scoring

---

## Previous Releases

*Previous changelog entries will be added as the project evolves.*