import * as React from 'react'
import { cn } from '@/lib/design-system/utils'
import {
  // Outline icons (24x24)
  HomeIcon,
  UserIcon,
  Cog6ToothIcon as SettingsIcon,
  MagnifyingGlassIcon as SearchIcon,
  PlusIcon,
  XMarkIcon as XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  HeartIcon,
  StarIcon,
  CameraIcon,
  PhotoIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  Bars3Icon as MenuIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShoppingCartIcon,
  LockClosedIcon,
  MinusIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  MapIcon,
  SunIcon,
  MoonIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  // No Thermometer icon in outline set; skip
  WifiIcon,
  ArrowTrendingDownIcon,
  // No Crown icon in outline set; skip
  // Wine and inventory specific icons
  BeakerIcon as WineIcon,
  PencilIcon as EditIcon,
  TrashIcon,
  FunnelIcon as FilterIcon,
  Squares2X2Icon as GridIcon,
  ListBulletIcon as ListIcon,
  BookmarkIcon as SaveIcon,
  ArrowPathIcon as LoaderIcon,
  ChartPieIcon as PieChartIcon,
  ChartBarIcon as ChartIcon,
  // Demo and landing page icons
  SparklesIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  UsersIcon,
  BoltIcon as ZapIcon,
  LightBulbIcon,
  BookOpenIcon,
  GiftIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  TrophyIcon as AwardIcon,
  AcademicCapIcon as LeafIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon,
  CpuChipIcon as BrainIcon,
} from '@heroicons/react/24/outline'

import {
  // Solid icons (20x20)
  HomeIcon as HomeSolidIcon,
  UserIcon as UserSolidIcon,
  Cog6ToothIcon as SettingsSolidIcon,
  MagnifyingGlassIcon as SearchSolidIcon,
  PlusIcon as PlusSolidIcon,
  XMarkIcon as XSolidIconAlt,
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
  InformationCircleIcon as InformationSolidIcon,
  ExclamationTriangleIcon as ExclamationSolidIcon,
  CheckCircleIcon as CheckSolidIcon,
  XCircleIcon as XSolidIconCircle,
  BellIcon as BellSolidIcon,
} from '@heroicons/react/20/solid'

// Icon registry for consistent usage across the application
export const iconRegistry = {
  // Navigation
  home: HomeIcon,
  'home-solid': HomeSolidIcon,
  user: UserIcon,
  'user-solid': UserSolidIcon,
  settings: SettingsIcon,
  'settings-solid': SettingsSolidIcon,
  search: SearchIcon,
  'search-solid': SearchSolidIcon,
  menu: MenuIcon,
  
  // Actions
  plus: PlusIcon,
  'plus-solid': PlusSolidIcon,
  x: XIcon,
  'x-solid': XSolidIconAlt,
  edit: EditIcon,
  trash: TrashIcon,
  save: SaveIcon,
  check: CheckCircleIcon,
  
  // Chevrons and arrows
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,
  
  // Visibility
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  
  // Favorites and ratings
  heart: HeartIcon,
  'heart-solid': HeartSolidIcon,
  star: StarIcon,
  'star-solid': StarSolidIcon,
  
  // Media
  camera: CameraIcon,
  photo: PhotoIcon,
  document: DocumentTextIcon,
  
  // Time and location
  clock: ClockIcon,
  calendar: CalendarIcon,
  'map-pin': MapPinIcon,
  globe: GlobeAltIcon,
  
  // Status and alerts
  info: InformationCircleIcon,
  'info-solid': InformationSolidIcon,
  warning: ExclamationTriangleIcon,
  'warning-solid': ExclamationSolidIcon,
  success: CheckCircleIcon,
  'success-solid': CheckSolidIcon,
  error: XCircleIcon,
  'error-solid': XSolidIconCircle,
  bell: BellIcon,
  'bell-solid': BellSolidIcon,
  
  // Wine and inventory specific
  wine: WineIcon,
  'wine-glass': WineIcon,
  filter: FilterIcon,
  grid: GridIcon,
  list: ListIcon,
  loader: LoaderIcon,
  'pie-chart': PieChartIcon,
  'check-circle': CheckCircleIcon,
  chart: ChartIcon,
  
  // Demo and landing page icons
  sparkles: SparklesIcon,
  play: PlayIcon,
  'clipboard-list': ClipboardDocumentListIcon,
  'shield-check': ShieldCheckIcon,
  users: UsersIcon,
  zap: ZapIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'exclamation-circle': ExclamationCircleIcon,
  'hand-thumb-up': HandThumbUpIcon,
  'hand-thumb-down': HandThumbDownIcon,
  map: MapIcon,
  sun: SunIcon,
  moon: MoonIcon,
  scale: ScaleIcon,
  building: BuildingOfficeIcon,
  // thermometer and crown are not available in our set; remove
  // Additional names used across codebase for compatibility
  'alert-circle': ExclamationTriangleIcon,
  'alert-triangle': ExclamationTriangleIcon,
  'refresh-cw': ArrowPathIcon,
  history: ClockIcon,
  'dollar-sign': CurrencyDollarIcon,
  'help-circle': QuestionMarkCircleIcon,
  utensils: UsersIcon,
  'chef-hat': UsersIcon,
  'chat-bubble-left': DocumentTextIcon,
  'x-circle': XCircleIcon,
  'shopping-cart': ShoppingCartIcon,
  lock: LockClosedIcon,
  minus: MinusIcon,
  'device-phone-mobile': DevicePhoneMobileIcon,
  'arrow-path': ArrowPathIcon,
  'arrow-down-tray': ArrowDownTrayIcon,
  'x-mark': XIcon,
  lightbulb: LightBulbIcon,
  'book-open': BookOpenIcon,
  gift: GiftIcon,
  'trending-up': TrendingUpIcon,
  'trending-down': ArrowTrendingDownIcon,
  award: AwardIcon,
  leaf: LeafIcon,
  'external-link': ExternalLinkIcon,
  brain: BrainIcon,
  'wifi-slash': WifiIcon,
} as const

export type IconName = keyof typeof iconRegistry

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const

/**
 * Professional icon component using Heroicons
 * Provides consistent sizing and styling across the application
 * Enforces design system guidelines with no custom emoji support
 * Updated with demo icons
 */
export function Icon({ name, size = 'md', className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden, ...props }: IconProps) {
  const IconComponent = iconRegistry[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in registry`)
    return null
  }
  
  return (
    <IconComponent
      className={cn(iconSizes[size], className)}
      data-testid={`icon-${name}`}
      aria-hidden={ariaLabel ? undefined : (ariaHidden ?? true)}
      aria-label={ariaLabel}
      focusable="false"
      {...props}
    />
  )
}

/**
 * Utility function to get all available icon names
 * Useful for development and documentation
 */
export function getAvailableIcons(): IconName[] {
  return Object.keys(iconRegistry) as IconName[]
}