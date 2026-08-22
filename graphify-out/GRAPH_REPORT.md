# Graph Report - .  (2026-07-06)

## Corpus Check
- 375 files · ~184,218 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2027 nodes · 5365 edges · 105 communities (96 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.7)
- Token cost: 53,261 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Service Worker & PWA Caching|Service Worker & PWA Caching]]
- [[_COMMUNITY_App Settings & Order PDF|App Settings & Order PDF]]
- [[_COMMUNITY_Core Server Actions|Core Server Actions]]
- [[_COMMUNITY_Supplies Management|Supplies Management]]
- [[_COMMUNITY_Purchase Orders|Purchase Orders]]
- [[_COMMUNITY_Catalog Forms & Color Picker|Catalog Forms & Color Picker]]
- [[_COMMUNITY_UI Primitives & Stats Bars|UI Primitives & Stats Bars]]
- [[_COMMUNITY_Requisitions|Requisitions]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Workspace View Registry|Workspace View Registry]]
- [[_COMMUNITY_Audit Log|Audit Log]]
- [[_COMMUNITY_Inventory Material Context|Inventory Material Context]]
- [[_COMMUNITY_Receipts Listing|Receipts Listing]]
- [[_COMMUNITY_Chat Server Actions|Chat Server Actions]]
- [[_COMMUNITY_Auth & Catalog Actions|Auth & Catalog Actions]]
- [[_COMMUNITY_Ink Lot Selection|Ink Lot Selection]]
- [[_COMMUNITY_Notifications & Email|Notifications & Email]]
- [[_COMMUNITY_Chat Bot UI|Chat Bot UI]]
- [[_COMMUNITY_Ink Lots Table|Ink Lots Table]]
- [[_COMMUNITY_AI Bot (Groq)|AI Bot (Groq)]]
- [[_COMMUNITY_Dashboard Metrics & Widgets|Dashboard Metrics & Widgets]]
- [[_COMMUNITY_Lot Correction & Fulfillment|Lot Correction & Fulfillment]]
- [[_COMMUNITY_Chat Channel Settings|Chat Channel Settings]]
- [[_COMMUNITY_Onboarding & Welcome|Onboarding & Welcome]]
- [[_COMMUNITY_Providers|Providers]]
- [[_COMMUNITY_Material Routing|Material Routing]]
- [[_COMMUNITY_Stock Overview Widgets|Stock Overview Widgets]]
- [[_COMMUNITY_User Profile Settings|User Profile Settings]]
- [[_COMMUNITY_Paper Inventory|Paper Inventory]]
- [[_COMMUNITY_Workspace Page & Roles|Workspace Page & Roles]]
- [[_COMMUNITY_Role Dashboards|Role Dashboards]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_User Schema & Detail|User Schema & Detail]]
- [[_COMMUNITY_Ink Inventory Grouping|Ink Inventory Grouping]]
- [[_COMMUNITY_Database Types & Push|Database Types & Push]]
- [[_COMMUNITY_shadcn Config|shadcn Config]]
- [[_COMMUNITY_Guided Tours|Guided Tours]]
- [[_COMMUNITY_Dashboard Layout Grid|Dashboard Layout Grid]]
- [[_COMMUNITY_Push Notification Client|Push Notification Client]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Chat Widget|Chat Widget]]
- [[_COMMUNITY_Output Registration|Output Registration]]
- [[_COMMUNITY_Password Reset & Redirects|Password Reset & Redirects]]
- [[_COMMUNITY_Message Editor Mentions|Message Editor Mentions]]
- [[_COMMUNITY_System Status|System Status]]
- [[_COMMUNITY_Receipt Editing|Receipt Editing]]
- [[_COMMUNITY_Global Search|Global Search]]
- [[_COMMUNITY_Consumption & Date Range|Consumption & Date Range]]
- [[_COMMUNITY_Ink Lot History|Ink Lot History]]
- [[_COMMUNITY_Paper Inventory View|Paper Inventory View]]
- [[_COMMUNITY_Auth Shell & Branding|Auth Shell & Branding]]
- [[_COMMUNITY_Login Flow|Login Flow]]
- [[_COMMUNITY_Providers Loading States|Providers Loading States]]
- [[_COMMUNITY_Inventory Hover Cards|Inventory Hover Cards]]
- [[_COMMUNITY_Receipt Form|Receipt Form]]
- [[_COMMUNITY_Rate Limiting|Rate Limiting]]
- [[_COMMUNITY_Order Receipts Detail|Order Receipts Detail]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_Message Item & Emoji|Message Item & Emoji]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Ink Inventory Actions|Ink Inventory Actions]]
- [[_COMMUNITY_Receipt Actions & Logging|Receipt Actions & Logging]]
- [[_COMMUNITY_Batch Receipt Form|Batch Receipt Form]]
- [[_COMMUNITY_Top Navigation|Top Navigation]]
- [[_COMMUNITY_Receivable Orders|Receivable Orders]]
- [[_COMMUNITY_Outputs History|Outputs History]]
- [[_COMMUNITY_Chat References|Chat References]]
- [[_COMMUNITY_Project Docs & Config|Project Docs & Config]]
- [[_COMMUNITY_Role Badges|Role Badges]]
- [[_COMMUNITY_Welcome Screens|Welcome Screens]]
- [[_COMMUNITY_Ink Catalog Cards|Ink Catalog Cards]]
- [[_COMMUNITY_Quality Badges|Quality Badges]]
- [[_COMMUNITY_Command Palette|Command Palette]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_404 Page|404 Page]]
- [[_COMMUNITY_Requisitions Widgets|Requisitions Widgets]]
- [[_COMMUNITY_Landing Contact & Footer|Landing Contact & Footer]]
- [[_COMMUNITY_Editor Suggestions|Editor Suggestions]]
- [[_COMMUNITY_Provider Map|Provider Map]]
- [[_COMMUNITY_Error Page|Error Page]]
- [[_COMMUNITY_Landing Partners & Art|Landing Partners & Art]]
- [[_COMMUNITY_Active Orders Widget|Active Orders Widget]]
- [[_COMMUNITY_Message List|Message List]]
- [[_COMMUNITY_App Icons & Brand Logos|App Icons & Brand Logos]]
- [[_COMMUNITY_Bot User Setup Script|Bot User Setup Script]]
- [[_COMMUNITY_Pending Quality Widget|Pending Quality Widget]]
- [[_COMMUNITY_Proxy Config|Proxy Config]]
- [[_COMMUNITY_UI Glyph Icons|UI Glyph Icons]]
- [[_COMMUNITY_Supabase Edge Function|Supabase Edge Function]]
- [[_COMMUNITY_Emoji Mart Types|Emoji Mart Types]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Next & Vercel Logos|Next & Vercel Logos]]
- [[_COMMUNITY_Vercel Cron Config|Vercel Cron Config]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 327 edges
2. `getSessionUser()` - 168 edges
3. `createAdminClient()` - 144 edges
4. `setAuditUser()` - 62 edges
5. `createClient()` - 54 edges
6. `useEmbedded()` - 30 edges
7. `p()` - 30 edges
8. `v` - 29 edges
9. `Database` - 28 edges
10. `toolbarStickyClass()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `rgbToHex()` --indirect_call--> `v`  [INFERRED]
  components/catalog/inks/ink-catalog-form.tsx → public/workbox-3c9d0171.js
- `PaperRequisitionSheet()` --indirect_call--> `m()`  [INFERRED]
  components/inventory/papers/paper-requisition-sheet.tsx → public/workbox-3c9d0171.js
- `InkReceiptForm()` --indirect_call--> `v`  [INFERRED]
  components/receipts/receipt-form.tsx → public/workbox-3c9d0171.js
- `PaperReceiptForm()` --indirect_call--> `v`  [INFERRED]
  components/receipts/receipt-form.tsx → public/workbox-3c9d0171.js
- `DashboardPage()` --calls--> `getSessionUser()`  [EXTRACTED]
  app/dashboard/page.tsx → actions/auth.actions.ts

## Import Cycles
- None detected.

## Communities (105 total, 9 thin omitted)

### Community 0 - "Service Worker & PWA Caching"
Cohesion: 0.06
Nodes (27): $(), Pane(), InkBatchForm(), PaperBatchForm(), M, a, b(), constructor() (+19 more)

### Community 1 - "App Settings & Order PDF"
Cohesion: 0.07
Nodes (51): DEFAULTS, getAppSettings(), parseSettings(), RawRow, settingsFrom(), updateSettings(), uploadCompanyLogo(), PurchaseOrderDetail (+43 more)

### Community 2 - "Core Server Actions"
Cohesion: 0.09
Nodes (66): getSessionUser(), getChannelMembers(), createInkCatalogItem(), toggleInkCatalogStatus(), updateInkCatalogItem(), createRequisition(), disableLot(), updateLotLocation() (+58 more)

### Community 3 - "Supplies Management"
Cohesion: 0.07
Nodes (53): ALLOWED_ROLES, createSupplyItem(), getSupplyAlerts(), getSupplyCategories(), getSupplyItemById(), getSupplyItems(), movementsFrom(), settingsFrom() (+45 more)

### Community 4 - "Purchase Orders"
Cohesion: 0.07
Nodes (43): CAN_RECEIVE, getPurchaseOrderById(), InkItemRow, MaterialType, OrderFilters, PaperItemRow, PATHS, PurchaseOrderRow (+35 more)

### Community 5 - "Catalog Forms & Color Picker"
Cohesion: 0.06
Nodes (39): ColorFormat, ColorPicker(), DEFAULT_VALUES, DrawerMode, FieldInfoData, hexToRgb(), InfoPopover(), InkCatalogForm() (+31 more)

### Community 6 - "UI Primitives & Stats Bars"
Cohesion: 0.07
Nodes (39): AlertRow(), OrdersStatsBar(), ProvidersStatsBar(), MetaItem(), DataRefresh(), formatAgo(), Props, MovementRow() (+31 more)

### Community 7 - "Requisitions"
Cohesion: 0.07
Nodes (39): CAN_MANAGE, getPendingRequisitions(), getRequisitionById(), PATHS, Requisition, RequisitionFilters, RequisitionInkItem, RequisitionPaperItem (+31 more)

### Community 8 - "Runtime Dependencies"
Cohesion: 0.04
Nodes (47): dependencies, class-variance-authority, clsx, cmdk, date-fns, driver.js, @ducanh2912/next-pwa, @emoji-mart/data (+39 more)

### Community 9 - "Workspace View Registry"
Cohesion: 0.09
Nodes (36): getPaperInventory(), getInkCatalogWithStock(), getPaperCatalogWithStock(), getRequisitions(), InkCatalogForRequisition, PaperInventoryPage(), OutputsHistoryPage(), InkRequisitionsPage() (+28 more)

### Community 10 - "Audit Log"
Cohesion: 0.10
Nodes (30): AuditStats, getAuditLog(), getAuditLogByRecord(), getAuditLogByUser(), getAuditStats(), requireAdmin(), getUsers(), AuditPage() (+22 more)

### Community 11 - "Inventory Material Context"
Cohesion: 0.09
Nodes (33): getInkInventory(), PaperCatalogItem, MaterialType, useMaterial(), InkInventoryPage(), DrawerState, PaperStatsBar(), Props (+25 more)

### Community 12 - "Receipts Listing"
Cohesion: 0.08
Nodes (32): getAllReceipts(), getPendingQualityReceipts(), InkReceiptWithContext, PaperReceiptWithContext, BULK_OPTIONS, Props, QUALITY_FILTERS, QualityValue (+24 more)

### Community 13 - "Chat Server Actions"
Cohesion: 0.11
Nodes (38): clearBotConversation(), getOrCreateBotChannel(), authorizeChannelOwner(), ChatMessage, ChatReaction, createChannel(), deleteChannel(), deleteMessage() (+30 more)

### Community 14 - "Auth & Catalog Actions"
Cohesion: 0.14
Nodes (26): getPublicSettings(), loginSchema, resetRequestSchema, ALLOWED_ROLES, getInkCatalog(), InkInsert, InkUpdate, ALLOWED_ROLES (+18 more)

### Community 15 - "Ink Lot Selection"
Cohesion: 0.09
Nodes (26): getAvailableInkLotsForItem(), getPaperLotHistory(), PaperLotHistory, FormValues, InkCatalogRow, Props, schema, fmtDate() (+18 more)

### Community 16 - "Notifications & Email"
Cohesion: 0.10
Nodes (29): requestPasswordResetAction(), APP_URL, dispatch(), getNotifications(), getUnreadCount(), markAllAsRead(), markAsRead(), NotificationType (+21 more)

### Community 17 - "Chat Bot UI"
Cohesion: 0.09
Nodes (24): ChannelWithMeta, ChatUser, BotTypingIndicator(), BotWelcome(), greeting(), PROMPTS, ChannelForm(), ChannelRow() (+16 more)

### Community 18 - "Ink Lots Table"
Cohesion: 0.12
Nodes (24): OrderStatus, DiffRow(), fmtDate(), InkLotsTableView(), Props, SortKey, DisponibleCell(), buildGroups() (+16 more)

### Community 19 - "AI Bot (Groq)"
Cohesion: 0.13
Nodes (28): askBot(), BOT_DEFAULTS, BotConfig, buildHistory(), cleanupAnswer(), escapeHtml(), getBotConfig(), getBotQueryStatus() (+20 more)

### Community 20 - "Dashboard Metrics & Widgets"
Cohesion: 0.11
Nodes (26): getDashboardKPIs(), MetricColor, MetricResult, runMetric(), WidgetPicker(), defaultParams(), MATERIAL_OPTIONS, MATERIAL_OPTIONS_BOTH (+18 more)

### Community 21 - "Lot Correction & Fulfillment"
Cohesion: 0.10
Nodes (23): AvailableInkLot, getAvailableInkLots(), getAvailablePaperLots(), Props, InkAllocation, InkFulfillBody(), PaperAllocation, PaperFulfillBody() (+15 more)

### Community 22 - "Chat Channel Settings"
Cohesion: 0.12
Nodes (20): getPinnedMessages(), Props, ChannelSettings(), Props, sameSet(), Props, displayName(), MemberPicker() (+12 more)

### Community 23 - "Onboarding & Welcome"
Cohesion: 0.11
Nodes (21): buildStats(), getWelcomeData(), ROLE_HOME, ROLE_TOUR, StatInputs, WelcomeAccent, WelcomeData, WelcomeStat (+13 more)

### Community 24 - "Providers"
Cohesion: 0.10
Nodes (23): ALLOWED_ROLES, getProviderById(), Provider, ProviderInsert, ProviderUpdate, PurchaseOrderSummary, Props, ProviderCard() (+15 more)

### Community 25 - "Material Routing"
Cohesion: 0.11
Nodes (20): logoutAction(), getMaterialFromPath(), Material, MATERIAL_ROUTES, MaterialContext, MaterialContextValue, MaterialProvider(), DashboardShell() (+12 more)

### Community 26 - "Stock Overview Widgets"
Cohesion: 0.14
Nodes (21): getLowStockAlerts(), getRecentActivity(), getStockOverview(), PAPER_COLORS, LowStockWidget(), StockRow(), EVENT_CONFIG, EventRow() (+13 more)

### Community 27 - "User Profile Settings"
Cohesion: 0.10
Nodes (22): AppUser, NotificationPreferences(), ExtUser, ProfileForm(), Props, ExtUser, Props, SettingsDrawer() (+14 more)

### Community 28 - "Paper Inventory"
Cohesion: 0.13
Nodes (18): CAN_MANAGE, PaperCatalogRow, PaperInventoryRow, PaperLot, PaperOutputRow, PaperReceiptRow, PATHS, RequisitionRow (+10 more)

### Community 29 - "Workspace Page & Roles"
Cohesion: 0.12
Nodes (21): WorkspacePage(), MATERIAL_META, paneValue(), parsePaneValue(), Role, WORKSPACE_SECTION_MAP, WorkspaceMaterial, WorkspaceSectionDef (+13 more)

### Community 30 - "Role Dashboards"
Cohesion: 0.14
Nodes (17): DashboardPage(), AdminDashboard(), defaultRange(), DEFAULTS, DefaultWidget, rects(), stripLayouts(), defaultRange() (+9 more)

### Community 31 - "Landing Page"
Cohesion: 0.14
Nodes (13): metadata, EspecialidadesSection(), BACKDROP_ROWS, HeroSection(), STATS, WORDS, LandingExperience(), LandingNav() (+5 more)

### Community 32 - "User Schema & Detail"
Cohesion: 0.12
Nodes (18): ChangePasswordForm(), formatDate(), Props, ROLE_OPTIONS, UserDetailSheet(), UserRole, Props, ScreenStart() (+10 more)

### Community 33 - "Ink Inventory Grouping"
Cohesion: 0.19
Nodes (17): InkLot, DisponibleCellInk(), buildGroups(), CatalogGroup, fmtDate(), InkCatalogGroupView(), Props, stockBadge() (+9 more)

### Community 34 - "Database Types & Push"
Cohesion: 0.12
Nodes (16): PushSubscriptionInput, savePushSubscription(), GET(), isRole(), parseRoleMentionId(), Role, ROLE_SET, CompositeTypes (+8 more)

### Community 35 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 36 - "Guided Tours"
Cohesion: 0.13
Nodes (12): auditTourSteps, catalogTourSteps, TOURS, createInventoryTourSteps(), InventoryTourOpts, ordersTourSteps, outputsHistoryTourSteps, providersTourSteps (+4 more)

### Community 37 - "Dashboard Layout Grid"
Cohesion: 0.22
Nodes (18): DASHBOARD_KEYS, getDashboardLayout(), resetDashboardLayout(), sanitizeLayouts(), sanitizeWidgets(), saveDashboardLayout(), BREAKPOINTS, COLS (+10 more)

### Community 38 - "Push Notification Client"
Cohesion: 0.16
Nodes (18): Notification, deletePushSubscription(), BY_ROLE, CHAT_MENTION, ExtUser, NotifConfig, NotifKey, Props (+10 more)

### Community 39 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 40 - "Chat Widget"
Cohesion: 0.15
Nodes (13): ChatChannel, getGeneralChannel(), ChatErrorBoundary, ChatWidget(), clamp(), DEFAULT, Pos, Props (+5 more)

### Community 41 - "Output Registration"
Cohesion: 0.15
Nodes (16): CAN_MANAGE, getAvailablePaperLotsForItem(), PATHS, AvailablePaperLot, Alloc, PaperOutputForm(), Props, createInkOutputSchema (+8 more)

### Community 42 - "Password Reset & Redirects"
Cohesion: 0.16
Nodes (11): ResetPasswordPage(), resetWrapper(), ROLE_REDIRECTS, schema, Values, metadata, AuthCard(), AuthField() (+3 more)

### Community 43 - "Message Editor Mentions"
Cohesion: 0.12
Nodes (17): attrsFor(), displayName(), HINTS, MentionItem, MentionList, MentionListHandle, MentionListProps, Props (+9 more)

### Community 44 - "System Status"
Cohesion: 0.14
Nodes (15): getSystemStats(), pingDatabase(), SystemStats, Accent, COMP_DOT, COMP_LABEL, CompStatus, CORE_SERVICES (+7 more)

### Community 45 - "Receipt Editing"
Cohesion: 0.14
Nodes (16): CorrectLotDialog(), EditReceiptForm(), Props, QualityStatus, correctInkLotSchema, CorrectInkLotValues, correctPaperLotSchema, CorrectPaperLotValues (+8 more)

### Community 46 - "Global Search"
Cohesion: 0.20
Nodes (13): globalSearch(), PROVIDER_TYPE_LABEL, SearchCategory, SearchResult, SearchResultType, STATUS_LABEL, CommandPalette(), Props (+5 more)

### Community 47 - "Consumption & Date Range"
Cohesion: 0.21
Nodes (11): getConsumptionData(), DateRangePicker(), defaultRange(), loadFromStorage(), makePresetRange(), Preset, defaultRange(), DEFAULTS (+3 more)

### Community 48 - "Ink Lot History"
Cohesion: 0.18
Nodes (12): getInkLotHistory(), InkLotHistory, fmtDate(), InkLotHistorySheet(), LotHistoryBody(), Props, QUALITY_LABELS, TimelineItem() (+4 more)

### Community 49 - "Paper Inventory View"
Cohesion: 0.15
Nodes (13): PaperCatalogForRequisition, InvSortKey, Props, STATUS_OPTIONS, View, InkItem, InkSelector(), MaterialType (+5 more)

### Community 50 - "Auth Shell & Branding"
Cohesion: 0.22
Nodes (9): ConfirmPage(), AuthShell(), CmykBackdropCycler(), Props, CMYK, CmykPattern(), diamondPoints(), NAV_LINKS (+1 more)

### Community 51 - "Login Flow"
Cohesion: 0.21
Nodes (8): ErrorContent(), LoginForm(), loginWrapper(), GoogleAuthButton(), AUTH_ERROR_MESSAGES, AuthErrorCode, AuthErrorEntry, getAuthErrorEntry()

### Community 52 - "Providers Loading States"
Cohesion: 0.24
Nodes (5): ProviderCardSkeleton(), ProvidersFiltersSkeleton(), ProvidersListSkeleton(), CmykSkeleton(), Props

### Community 53 - "Inventory Hover Cards"
Cohesion: 0.22
Nodes (10): fmtDate(), InkInfoHoverCard(), num(), PaperInfoHoverCard(), ProviderInfoHoverCard(), ProviderReceipt, userName(), HoverCard() (+2 more)

### Community 54 - "Receipt Form"
Cohesion: 0.14
Nodes (12): Drawer(), InkReceiptForm(), inkSchema, InkValues, PaperReceiptForm(), paperSchema, PaperValues, Props (+4 more)

### Community 55 - "Rate Limiting"
Cohesion: 0.21
Nodes (11): isSafeRedirectPath(), loginAction(), botLimiter, check(), checkLoginRateLimit(), checkPasswordResetRateLimit(), getClientIp(), loginLimiter (+3 more)

### Community 56 - "Order Receipts Detail"
Cohesion: 0.22
Nodes (10): getOrderWithReceipts(), PaperReceiptRow, OrderReceiptPage(), EditDialog, fmtDate(), OrderReceiptDetail(), Props, QualityDialog (+2 more)

### Community 57 - "Root Layout & Fonts"
Cohesion: 0.19
Nodes (9): TopProgressBar(), bricolage, jetbrainsMono, metadata, RootLayout(), workSans, QueryProvider(), Props (+1 more)

### Community 58 - "Message Item & Emoji"
Cohesion: 0.22
Nodes (11): EmojiPicker(), groupReactions(), MessageItem(), Props, sanitize(), ChatPriority, PRIORITY_META, PRIORITY_ORDER (+3 more)

### Community 59 - "Dev Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-next, supabase, tailwindcss, @tailwindcss/postcss, @types/leaflet, @types/node (+5 more)

### Community 60 - "Ink Inventory Actions"
Cohesion: 0.17
Nodes (9): CAN_MANAGE, InkCatalogRow, InkInventoryRow, InkOutputRow, InkReceiptRow, InventoryFilters, PATHS, RequisitionRow (+1 more)

### Community 61 - "Receipt Actions & Logging"
Cohesion: 0.21
Nodes (10): CAN_RECEIVE, CERT_EXTS, InkReceiptRow, InkReceiptWithInventory, PaperReceiptWithInventory, PATHS, QualityCertificate, uploadCertificate() (+2 more)

### Community 62 - "Batch Receipt Form"
Cohesion: 0.17
Nodes (11): OrderWithReceipts, BatchDrawer(), BatchReceiptForm(), inkBatchSchema, InkBatchValues, ItemRow(), paperBatchSchema, PaperBatchValues (+3 more)

### Community 63 - "Top Navigation"
Cohesion: 0.24
Nodes (8): ExtUser, PAGE_TITLES, TopNav(), WorkspaceToggle(), formatAgo(), GlobalDataRefresh(), ThemeToggle(), useCommandPalette()

### Community 64 - "Receivable Orders"
Cohesion: 0.24
Nodes (9): getReceivableOrders(), ReceivableOrder, fmtDate(), isOverdue(), ItemProgress(), OrdersTable(), PendingOrdersList(), Props (+1 more)

### Community 65 - "Outputs History"
Cohesion: 0.27
Nodes (9): InkOutputRecord, PaperOutputRecord, fmtDate(), OutputsHistory(), Props, InkProps, InkReturnForm(), PaperProps (+1 more)

### Community 66 - "Chat References"
Cohesion: 0.20
Nodes (10): searchReferences(), resolveRefItems(), DOMAIN_LABEL, isRefDomain(), isRefSection(), MATERIAL_SECTIONS, REF_DOMAINS, REF_SECTIONS (+2 more)

### Community 67 - "Project Docs & Config"
Cohesion: 0.22
Nodes (11): Next.js Agent Rules, This is NOT the Next.js you know, CLAUDE.md AGENTS Reference, pnpm ignoredBuiltDependencies, sharp, unrs-resolver, create-next-app, IL-Stockroom Next.js Project (+3 more)

### Community 68 - "Role Badges"
Cohesion: 0.25
Nodes (8): Badge(), badgeVariants, ROLE_CONFIG, RoleBadge(), UserRole, Props, ScreenRole(), splitLines()

### Community 69 - "Welcome Screens"
Cohesion: 0.24
Nodes (7): Props, ScreenModules(), WelcomeChecklist(), ROLE_MODULES, ROLE_STEPS, UserRole, WelcomeModule

### Community 70 - "Ink Catalog Cards"
Cohesion: 0.27
Nodes (8): InkCatalogItem, InkCatalogCard(), Props, DrawerState, InkStatsBar(), Props, relativeTime(), STOCK_FILTERS

### Community 71 - "Quality Badges"
Cohesion: 0.22
Nodes (8): CONFIG, Quality, QualityBadge(), OPTIONS, Props, QualityUpdateForm(), updateQualitySchema, UpdateQualityValues

### Community 72 - "Command Palette"
Cohesion: 0.20
Nodes (9): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+1 more)

### Community 73 - "Package Scripts"
Cohesion: 0.20
Nodes (9): name, packageManager, private, scripts, build, dev, lint, start (+1 more)

### Community 74 - "PWA Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 75 - "404 Page"
Cohesion: 0.32
Nodes (4): CMYKNumber(), LAYERS, Props, NotFoundContent()

### Community 76 - "Requisitions Widgets"
Cohesion: 0.38
Nodes (5): getPendingRequisitions(), MyRequisitionsWidget(), PendingRequisitionsWidget(), STATUS_COLOR, STATUS_LABEL

### Community 77 - "Landing Contact & Footer"
Cohesion: 0.33
Nodes (4): ContactForm(), ContactoSection(), FooterSection(), CERTIFICATIONS

### Community 78 - "Editor Suggestions"
Cohesion: 0.33
Nodes (6): createMentionSuggestion(), createReferenceSuggestion(), MessageEditor(), placePopup(), Reference, renderExtensions

### Community 79 - "Provider Map"
Cohesion: 0.29
Nodes (3): MapCoreProps, markerIcon, Props

### Community 80 - "Error Page"
Cohesion: 0.40
Nodes (3): BAND_PATTERN, Props, ServerErrorContent()

### Community 81 - "Landing Partners & Art"
Cohesion: 0.50
Nodes (3): CMYKDrop(), SociosSection(), PARTNERS

### Community 82 - "Active Orders Widget"
Cohesion: 0.67
Nodes (3): getActiveOrders(), ActiveOrdersWidget(), STATUS_LABEL

### Community 83 - "Message List"
Cohesion: 0.67
Nodes (3): dayLabel(), MessageList(), Props

### Community 84 - "App Icons & Brand Logos"
Cohesion: 0.50
Nodes (4): IL App Icon (192px), IL App Icon (512px), IL Brand Logo (Light Variant), IL Brand Logo (Dark Variant)

### Community 85 - "Bot User Setup Script"
Cohesion: 0.50
Nodes (3): admin, env, META

### Community 88 - "UI Glyph Icons"
Cohesion: 0.67
Nodes (3): File / Document UI Glyph, Globe / World UI Glyph, Window / Browser UI Glyph

## Knowledge Gaps
- **584 isolated node(s):** `RawRow`, `DEFAULTS`, `loginSchema`, `resetRequestSchema`, `BotConfig` (+579 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Primitives & Stats Bars` to `Service Worker & PWA Caching`, `App Settings & Order PDF`, `Supplies Management`, `Purchase Orders`, `Catalog Forms & Color Picker`, `Requisitions`, `Workspace View Registry`, `Audit Log`, `Inventory Material Context`, `Receipts Listing`, `Auth & Catalog Actions`, `Ink Lot Selection`, `Chat Bot UI`, `Ink Lots Table`, `Dashboard Metrics & Widgets`, `Lot Correction & Fulfillment`, `Chat Channel Settings`, `Onboarding & Welcome`, `Providers`, `Material Routing`, `Stock Overview Widgets`, `User Profile Settings`, `Paper Inventory`, `Workspace Page & Roles`, `Landing Page`, `Ink Inventory Grouping`, `Push Notification Client`, `Output Registration`, `Message Editor Mentions`, `System Status`, `Receipt Editing`, `Global Search`, `Consumption & Date Range`, `Ink Lot History`, `Paper Inventory View`, `Providers Loading States`, `Inventory Hover Cards`, `Receipt Form`, `Root Layout & Fonts`, `Message Item & Emoji`, `Batch Receipt Form`, `Top Navigation`, `Receivable Orders`, `Outputs History`, `Role Badges`, `Welcome Screens`, `Ink Catalog Cards`, `Quality Badges`, `Command Palette`, `Requisitions Widgets`, `Editor Suggestions`, `Active Orders Widget`, `Pending Quality Widget`?**
  _High betweenness centrality (0.327) - this node is a cross-community bridge._
- **Why does `getSessionUser()` connect `Core Server Actions` to `App Settings & Order PDF`, `Supplies Management`, `Purchase Orders`, `Requisitions`, `Workspace View Registry`, `Audit Log`, `Inventory Material Context`, `Receipts Listing`, `Chat Server Actions`, `Auth & Catalog Actions`, `Notifications & Email`, `AI Bot (Groq)`, `Dashboard Metrics & Widgets`, `Onboarding & Welcome`, `Providers`, `Material Routing`, `Stock Overview Widgets`, `Paper Inventory`, `Workspace Page & Roles`, `Role Dashboards`, `Database Types & Push`, `Dashboard Layout Grid`, `Output Registration`, `Global Search`, `Order Receipts Detail`, `Ink Inventory Actions`, `Receipt Actions & Logging`, `Chat References`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Package Scripts`, `App Settings & Order PDF`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `RawRow`, `DEFAULTS`, `loginSchema` to the rest of the system?**
  _584 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Service Worker & PWA Caching` be split into smaller, more focused modules?**
  _Cohesion score 0.05567765567765568 - nodes in this community are weakly interconnected._
- **Should `App Settings & Order PDF` be split into smaller, more focused modules?**
  _Cohesion score 0.07003129890453834 - nodes in this community are weakly interconnected._
- **Should `Core Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.09335038363171355 - nodes in this community are weakly interconnected._