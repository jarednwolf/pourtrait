# Troubleshooting Guide

Common issues and solutions for Pourtrait setup and development.

## Node.js Issues

### "command not found: node"
**Problem**: Node.js not installed or not in PATH

**Solutions**:
1. Install Node.js using nvm (recommended):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.nvm/nvm.sh
   nvm install 18.18.0
   ```

2. Install via Homebrew (macOS):
   ```bash
   brew install node@18
   echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zshrc
   ```

3. Download from [nodejs.org](https://nodejs.org/)

### Version Too Old
**Problem**: Node.js version below 18.0.0

**Solution**: Update to Node.js 18+ using nvm:
```bash
nvm install 18.18.0
nvm use 18.18.0
nvm alias default 18.18.0
```

### Permission Errors
**Problem**: EACCES errors when installing packages

**Solutions**:
1. Use nvm instead of system Node.js
2. Fix npm permissions:
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   ```

## Dependency Issues

### Network Timeouts
**Problem**: npm install fails with network errors

**Solutions**:
1. Use different registry:
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

3. Use yarn instead:
   ```bash
   npm install -g yarn
   yarn install
   ```

### Cache Issues
**Problem**: Corrupted npm cache causing install failures

**Solution**:
```bash
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

### Dependency Conflicts
**Problem**: Version conflicts between dependencies

**Solutions**:
1. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Use npm's legacy peer deps:
   ```bash
   npm install --legacy-peer-deps
   ```

## Development Server Issues

### Port 3000 in Use
**Problem**: "Port 3000 is already in use"

**Solutions**:
1. Kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. Use a different port:
   ```bash
   npm run dev -- -p 3001
   ```

### Environment Variables Not Loading
**Problem**: Environment variables not available in application

**Solutions**:
1. Restart the development server after changing `.env.local`
2. Check file name is exactly `.env.local`
3. Verify variables start with `NEXT_PUBLIC_` for client-side access
4. Check for syntax errors in `.env.local`

### TypeScript Errors
**Problem**: TypeScript compilation errors

**Solutions**:
1. Run type check to see detailed errors:
   ```bash
   npm run type-check
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. Restart TypeScript server in VS Code:
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

## Build Issues

### Build Fails
**Problem**: `npm run build` fails

**Solutions**:
1. Check for TypeScript errors:
   ```bash
   npm run type-check
   ```

2. Check for linting errors:
   ```bash
   npm run lint
   ```

3. Clear build cache:
   ```bash
   rm -rf .next
   npm run build
   ```

### Out of Memory
**Problem**: Build fails with out of memory error

**Solution**: Increase Node.js memory limit:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

## Testing Issues

### Tests Not Running
**Problem**: Vitest tests fail to start

**Solutions**:
1. Check test setup file exists:
   ```bash
   ls src/test/setup.ts
   ```

2. Verify vitest.config.ts is correct
3. Clear test cache:
   ```bash
   npx vitest run --reporter=verbose
   ```

### Mock Issues
**Problem**: Mocks not working properly

**Solutions**:
1. Check mock syntax uses `vi.mock()` not `jest.mock()`
2. Ensure mocks are defined before imports
3. Clear module cache in tests

## Supabase Issues

### Connection Errors
**Problem**: Cannot connect to Supabase

**Solutions**:
1. Verify environment variables in `.env.local`:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Check Supabase project status at [supabase.com](https://supabase.com)
3. Verify API keys are correct and not expired

### Authentication Issues
**Problem**: Supabase auth not working

**Solutions**:
1. Check RLS policies are configured correctly
2. Verify auth helpers are properly imported
3. Check browser console for auth errors

## VS Code Issues

### Extensions Not Working
**Problem**: TypeScript/ESLint extensions not functioning

**Solutions**:
1. Reload VS Code window: Cmd/Ctrl + Shift + P → "Developer: Reload Window"
2. Check extension versions are compatible
3. Restart TypeScript server: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

### IntelliSense Not Working
**Problem**: No autocomplete or type checking

**Solutions**:
1. Open TypeScript file and check status bar shows "TypeScript"
2. Ensure workspace is using correct TypeScript version
3. Check tsconfig.json is valid

## Getting Help

If you're still experiencing issues:

1. **Check the logs**: Look at terminal output for specific error messages
2. **Search existing issues**: Check GitHub issues for similar problems
3. **Create detailed bug report**: Include:
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Complete error message
   - Steps to reproduce

## Next Steps

After resolving issues, return to [installation.md](./installation.md) or proceed to [../02-development/README.md](../02-development/README.md).