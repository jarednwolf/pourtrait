# Development Guidelines

## 🎯 Task Execution Protocol

### **Before Starting Any Task**

1. **Run baseline health check**
   ```bash
   npm run pre-task
   ```
   - Documents current state of codebase
   - Identifies pre-existing issues
   - Ensures clean starting point

2. **Check for dependency upgrades**
   ```bash
   npm run upgrade-check
   ```
   - Look for outdated dependencies that might affect the task
   - Consider upgrading before implementing custom solutions

### **During Task Implementation**

1. **Prefer existing solutions over custom implementations**
   - Check npm registry for established packages
   - Verify compatibility with current stack
   - Consider official integrations (e.g., Storybook with Next.js)

2. **Run incremental tests**
   ```bash
   npm test -- --run [specific-paths]
   ```

3. **Check for breaking changes**
   ```bash
   npm run type-check
   npm run lint
   ```

### **Before Marking Task Complete**

1. **Run task-specific validation**
   ```bash
   npm run validate-task "Task Name" "test/paths"
   ```

2. **Full codebase validation**
   ```bash
   npm run full-validation
   ```

3. **Document completion status**
   - ✅ Task requirements met
   - ✅ Tests passing (specify which)
   - ✅ No regressions introduced
   - ⚠️ Any pre-existing issues found
   - 💡 Recommendations for improvements

## 🔄 Decision-Making Framework

### **When to Upgrade vs. Build Custom**

**Upgrade Dependencies When:**
- Official packages exist for the integration
- Current versions are significantly outdated
- New versions provide required functionality
- Upgrade path is straightforward

**Build Custom When:**
- No suitable packages exist
- Existing packages don't meet specific requirements
- Custom solution provides significant benefits
- Dependencies would add unnecessary complexity

### **Dependency Management**

1. **Check compatibility first**
   ```bash
   npm view [package-name] peerDependencies
   ```

2. **Prefer official integrations**
   - @storybook/nextjs over manual setup
   - Official TypeScript definitions
   - Framework-specific packages

3. **Version alignment**
   - Keep related packages in sync
   - Check for peer dependency conflicts
   - Use exact versions for critical dependencies

## 🧪 Testing Strategy

### **Test Coverage Requirements**

1. **New components**: 100% test coverage required
2. **Modified components**: Maintain existing coverage
3. **Integration points**: Test interactions between components
4. **Edge cases**: Test error conditions and boundary cases

### **Test Categories**

1. **Unit Tests**: Individual component functionality
2. **Integration Tests**: Component interactions
3. **Professional Standards**: Design system compliance
4. **Accessibility Tests**: WCAG compliance validation

## 🚀 Quality Gates

### **Pre-Commit Checks**
- Type checking passes
- Linting passes
- Relevant tests pass
- No console errors

### **Pre-Task-Completion Checks**
- Full test suite passes
- Build succeeds
- No regressions introduced
- Documentation updated

### **Pre-Deployment Checks**
- All quality gates pass
- Performance benchmarks met
- Security audit clean
- Accessibility compliance verified

## 🛠 Tool Configuration

### **Recommended VS Code Extensions**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Auto Rename Tag

### **Git Hooks (Future Enhancement)**
```bash
# Pre-commit hook
npm run type-check && npm run lint

# Pre-push hook  
npm run full-validation
```

## 📋 Checklists

### **Task Start Checklist**
- [ ] Run baseline health check
- [ ] Check for relevant dependency updates
- [ ] Review task requirements thoroughly
- [ ] Identify potential integration points
- [ ] Plan testing strategy

### **Task Completion Checklist**
- [ ] All task requirements implemented
- [ ] Task-specific tests written and passing
- [ ] Full test suite passes
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] No regressions introduced
- [ ] Performance impact assessed

### **Dependency Decision Checklist**
- [ ] Searched for existing solutions
- [ ] Checked official integrations
- [ ] Verified compatibility
- [ ] Assessed maintenance burden
- [ ] Considered long-term implications
- [ ] Documented decision rationale

## 🎯 Success Metrics

### **Code Quality**
- Zero linting errors
- 100% TypeScript coverage
- Comprehensive test coverage
- No security vulnerabilities

### **Performance**
- Build time < 30 seconds
- Test suite < 10 seconds
- Bundle size optimized
- Core Web Vitals green

### **Developer Experience**
- Clear documentation
- Consistent patterns
- Helpful error messages
- Efficient workflows

## 🔄 Continuous Improvement

### **Regular Reviews**
- Weekly dependency updates
- Monthly security audits
- Quarterly architecture reviews
- Annual technology stack assessment

### **Feedback Loops**
- Post-task retrospectives
- Performance monitoring
- User experience feedback
- Developer satisfaction surveys