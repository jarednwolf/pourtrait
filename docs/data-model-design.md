# Data Model Design Documentation

## Overview

This document outlines the design decisions and rationale behind the Pourtrait wine sommelier application's data model. The schema is designed to support comprehensive wine inventory management, taste profiling, and AI-powered recommendations while maintaining data integrity and performance.

## Core Design Principles

### 1. User-Centric Architecture
- All data is organized around individual users with strict Row Level Security (RLS)
- Each user has complete ownership and control over their wine data
- Privacy-first approach with granular permission controls

### 2. Extensible JSON Storage
- Complex nested data structures use JSONB for flexibility
- Allows for future feature additions without schema migrations
- Maintains type safety through Zod validation schemas

### 3. Performance Optimization
- Strategic indexing on frequently queried fields
- Materialized views for complex aggregations
- Efficient search capabilities using PostgreSQL's full-text search

### 4. Data Integrity
- Comprehensive validation at both application and database levels
- Foreign key constraints ensure referential integrity
- Check constraints prevent invalid data states

## Table Design Decisions

### User Profiles Table

**Design Decision**: Extend Supabase's built-in auth.users table rather than duplicating user data.

**Rationale**: 
- Leverages Supabase's robust authentication system
- Maintains consistency with auth flows
- Reduces data duplication and sync issues

**Key Fields**:
- `preferences`: JSONB field for flexible user settings
- `experience_level`: Enum for tailoring recommendations
- `onboarding_completed`: Tracks user journey progress

### Wines Table

**Design Decision**: Store wine data with both structured fields and flexible JSON extensions.

**Rationale**:
- Core wine attributes (name, producer, vintage) are structured for efficient querying
- `external_data` JSONB field allows integration with wine databases
- `drinking_window` JSONB enables complex temporal logic
- `varietal` array supports multi-varietal wines

**Key Design Choices**:
- Vintage validation prevents unrealistic dates
- Quantity tracking supports inventory management
- Personal vs. professional ratings separation
- Image storage via URL references

### Taste Profiles Table

**Design Decision**: One-to-one relationship with users, storing preferences as JSONB objects.

**Rationale**:
- Taste preferences are complex, multi-dimensional data
- JSONB allows for flexible preference structures
- Separate profiles for different wine types (red, white, sparkling)
- Learning history enables AI model improvement

**Schema Structure**:
```json
{
  "fruitiness": 1-10,
  "earthiness": 1-10,
  "oakiness": 1-10,
  "acidity": 1-10,
  "tannins": 1-10,
  "sweetness": 1-10,
  "body": "light|medium|full",
  "preferredRegions": ["string"],
  "preferredVarietals": ["string"],
  "dislikedCharacteristics": ["string"]
}
```

### Recommendations Table

**Design Decision**: Polymorphic design supporting multiple recommendation types.

**Rationale**:
- Single table for all recommendation types reduces complexity
- `type` field differentiates between inventory, purchase, and pairing recommendations
- Flexible `context` and `suggested_wine` JSONB fields
- User feedback tracking for ML model improvement

**Recommendation Types**:
1. **Inventory**: Suggests wines from user's collection
2. **Purchase**: Recommends wines to buy
3. **Pairing**: Suggests wines for specific occasions/foods

### Consumption History Table

**Design Decision**: Separate table for tracking wine consumption events.

**Rationale**:
- Enables detailed consumption analytics
- Supports automatic inventory updates via triggers
- Captures contextual information (occasion, companions, food pairing)
- Feeds into taste profile learning algorithms

## Validation Strategy

### Two-Layer Validation

1. **Application Layer (Zod)**:
   - Type-safe validation with TypeScript integration
   - Detailed error messages for user feedback
   - Flexible validation rules for different contexts

2. **Database Layer (PostgreSQL)**:
   - Check constraints for data integrity
   - Foreign key constraints for referential integrity
   - Triggers for business logic enforcement

### Validation Examples

```typescript
// Wine input validation
const wineInputSchema = z.object({
  name: z.string().min(1).max(200),
  vintage: z.number().int().min(1800).max(currentYear + 5),
  quantity: z.number().int().min(0),
  // ... additional fields
})

// Database constraint
CHECK (vintage >= 1800 AND vintage <= EXTRACT(YEAR FROM NOW()) + 5)
```

## Security Model

### Row Level Security (RLS)

All tables implement RLS policies ensuring users can only access their own data:

```sql
-- Example policy
CREATE POLICY "Users can manage own wines" ON wines
  FOR ALL USING (auth.uid() = user_id);
```

### Policy Types:
- **SELECT**: Users can view their own data
- **INSERT**: Users can create data associated with their account
- **UPDATE**: Users can modify their own data
- **DELETE**: Users can remove their own data

### System Operations:
- Recommendations and notifications can be inserted by the system
- Admin operations use service role key with elevated permissions

## Performance Considerations

### Indexing Strategy

1. **Primary Access Patterns**:
   - User-based queries: `idx_wines_user_id`
   - Wine search: `idx_wines_search` (GIN index for full-text search)
   - Filtering: Individual indexes on `type`, `region`, `vintage`

2. **JSONB Indexing**:
   - `drinking_window` GIN index for temporal queries
   - Preference-based searches on taste profiles

3. **Temporal Queries**:
   - Consumption history by date
   - Notification chronological ordering

### Query Optimization

1. **Materialized Views**:
   - `user_wine_stats`: Pre-calculated user statistics
   - `wines_with_status`: Wines with calculated drinking window status

2. **Efficient Aggregations**:
   - User wine counts and ratings
   - Consumption patterns and trends

## Data Relationships

### Entity Relationship Overview

```
Users (auth.users)
├── UserProfiles (1:1)
├── TasteProfiles (1:1)
├── Wines (1:N)
├── ConsumptionHistory (1:N)
├── DrinkingPartners (1:N)
├── Recommendations (1:N)
└── Notifications (1:N)

Wines
├── ConsumptionHistory (1:N)
└── Recommendations (N:1, optional)
```

### Cascade Behaviors

- **User deletion**: Cascades to all user-owned data
- **Wine deletion**: Sets recommendation wine_id to NULL
- **Consumption tracking**: Automatically updates wine quantities

## Future Extensibility

### Planned Extensions

1. **Wine Database Integration**:
   - `external_data` JSONB field ready for API data
   - Professional ratings and tasting notes
   - Market pricing information

2. **Social Features**:
   - Drinking partners with shared taste profiles
   - Wine sharing and recommendations between users

3. **Advanced Analytics**:
   - Consumption patterns and trends
   - Cellar value tracking
   - Drinking window optimization

### Migration Strategy

- JSONB fields allow adding new data without schema changes
- New tables can be added for major feature additions
- Backward compatibility maintained through versioned APIs

## Validation Schema Examples

### Complete Wine Validation

```typescript
export const wineSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(200),
  producer: z.string().min(1).max(200),
  vintage: z.number().int().min(1800).max(new Date().getFullYear() + 5),
  region: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  varietal: z.array(z.string().min(1).max(50)).min(1),
  type: z.enum(['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified']),
  quantity: z.number().int().min(0),
  drinkingWindow: drinkingWindowSchema,
  externalData: externalWineDataSchema,
  // ... additional fields with validation
})
```

### Taste Profile Validation

```typescript
export const flavorProfileSchema = z.object({
  fruitiness: z.number().min(1).max(10),
  earthiness: z.number().min(1).max(10),
  // ... other characteristics
  body: z.enum(['light', 'medium', 'full']),
  preferredRegions: z.array(z.string().min(1).max(100)),
  preferredVarietals: z.array(z.string().min(1).max(50)),
  dislikedCharacteristics: z.array(z.string().min(1).max(100))
})
```

## Conclusion

This data model provides a robust foundation for the Pourtrait wine sommelier application, balancing flexibility with performance and security. The design supports current requirements while maintaining extensibility for future features. The combination of structured data and JSONB fields allows for both efficient querying and flexible data storage, while comprehensive validation ensures data integrity at all levels.