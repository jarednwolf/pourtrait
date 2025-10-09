#!/usr/bin/env node
/*
  Generates PWA icons and OG/social images from existing assets.
  - Inputs: public/branding/app-icon.svg (preferred) or public/branding/wordmark.svg, public/images/hero.jpg
  - Outputs: public/icons/icon-*.png, public/icons/shortcut-*.png, public/images/og-card.jpg, public/images/social-square.jpg
*/

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true })
}

async function generatePwaIcons() {
  // Prefer app icon; fall back to wordmark
  const appIcon = path.resolve('public/branding/app-icon.svg')
  const wordmark = path.resolve('public/branding/wordmark.svg')
  const src = fs.existsSync(appIcon) ? appIcon : wordmark
  const outDir = path.resolve('public/icons')
  await ensureDir(outDir)

  const sizes = [16, 32, 64, 72, 96, 128, 144, 152, 180, 192, 384, 512]
  for (const size of sizes) {
    const out = path.join(outDir, `icon-${size}x${size}.png`)
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(out)
  }

  // Shortcut icons at 96x96
  const shortcuts = ['shortcut-add-wine', 'shortcut-recommendations', 'shortcut-scan']
  for (const name of shortcuts) {
    const out = path.join(outDir, `${name}.png`)
    await sharp(src)
      .resize(96, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(out)
  }
}

async function generateOgCard() {
  const heroSrc = path.resolve('public/images/hero.jpg')
  const wordmarkSrc = path.resolve('public/branding/wordmark.svg')
  const out = path.resolve('public/images/og-card.jpg')
  await ensureDir(path.dirname(out))

  // Base: 1200x630 cover crop
  let base = sharp(heroSrc).resize(1200, 630, { fit: 'cover', position: 'attention' })

  // Translucent white panel for readability
  const panel = await sharp({
    create: {
      width: 760,
      height: 200,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0.88 },
    },
  })
    .png()
    .toBuffer()

  // Wordmark scaled to width ~700px
  const wordmark = await sharp(wordmarkSrc)
    .resize({ width: 700 })
    .png()
    .toBuffer()

  // Compose panel then wordmark at offsets
  const composed = await base
    .composite([
      { input: panel, left: 60, top: 60 },
      { input: wordmark, left: 90, top: 90 },
    ])
    .jpeg({ quality: 85 })
    .toFile(out)

  return composed
}

async function generateSocialSquare() {
  const heroSrc = path.resolve('public/images/hero.jpg')
  const wordmarkSrc = path.resolve('public/branding/wordmark.svg')
  const out = path.resolve('public/images/social-square.jpg')
  await ensureDir(path.dirname(out))

  let base = sharp(heroSrc).resize(1080, 1080, { fit: 'cover', position: 'attention' })

  const panel = await sharp({
    create: {
      width: 840,
      height: 240,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0.88 },
    },
  }).png().toBuffer()

  const wordmark = await sharp(wordmarkSrc).resize({ width: 800 }).png().toBuffer()

  await base
    .composite([
      { input: panel, left: 120, top: 80 },
      { input: wordmark, left: 140, top: 100 },
    ])
    .jpeg({ quality: 85 })
    .toFile(out)
}

async function run() {
  await generatePwaIcons()
  await generateOgCard()
  await generateSocialSquare()
  // eslint-disable-next-line no-console
  console.log('✔ Generated PWA icons and OG card')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})


