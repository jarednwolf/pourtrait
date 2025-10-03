# Development Workflow

## 🚀 Quick Start for New Tasks

### **1. Pre-Task Setup**
```bash
# Run baseline health check
npm run pre-task

# Analyze dependencies for your task
./scripts/dependency-advisor.sh "your-search-term"
```

### **2. Task Implementation**
```bash
# During development - run relevant tests
npm test -- --run src/path/to/your/changes

# Check types and linting frequently
npm run type-check
npm run lint
```

### **3. Task Completion**
```bash
# Validate your specific task
npm run validate-task "Task Name" "src/your/test/paths"

# Or run full validation
npm run full-validation
```

## 📋 Available Scripts

### **Quality Assurance**
- `npm run health-check` - Full codebase health assessment
- `npm run full-validation` - Complete validation pipeline
- `npm run upgrade-check` - Check for outdated dependencies

### **Development**
- `npm run pre-task` - Run before starting any task
- `npm run post-task` - Run after completing any task
- `npm run validate-task` - Validate specific task completion

### **Analysis Tools**
- `./scripts/dependency-advisor.sh <term>` - Get dependency recommendations
- `./scripts/task-validation.sh <name> <paths>` - Validate task completion

## 🎯 Decision Framework

### **When to Use Existing Packages**
1. Official framework integrations exist
2. Package is actively maintained
3. Good TypeScript support
4. Fits our architecture

### **When to Build Custom**
1. No suitable packages exist
2. Specific requirements not met
3. Performance critical
4. Simple implementation

## 🔄 Workflow Example

```bash
# Starting a new task
npm run pre-task
./scripts/dependency-advisor.sh "component-library"

# During implementation
npm test -- --run src/components/
npm run type-check

# Before marking complete
npm run validate-task "Design System" "src/components/ src/lib/design-system/"

# Final validation
npm run full-validation
```

## 📚 Documentation

- [Development Guidelines](docs/development-guidelines.md) - Complete development standards
- [Task Analysis Template](docs/templates/task-analysis-template.md) - Pre-task planning template
- [Design System Docs](docs/04-features/design-system.md) - Component library documentation

## 🎯 Quality Gates

Every task must pass:
- ✅ Type checking
- ✅ Linting
- ✅ Full test suite
- ✅ Build validation
- ✅ No regressions introduced