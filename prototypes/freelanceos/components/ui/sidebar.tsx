/* shadcn/ui Sidebar — adapted for wipOS (zero-build CDN) */

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "13rem";
const SIDEBAR_WIDTH_MOBILE = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_PADDING = "0.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((open: boolean) => boolean)) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

function readSidebarCookie(): boolean | undefined {
  const match = document.cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=(true|false)`));
  return match ? match[1] === "true" : undefined;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(() => readSidebarCookie() ?? defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) setOpenProp(openState);
      else _setOpen(openState);
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((v) => !v) : setOpen((v) => !v);
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            "--sidebar-padding": SIDEBAR_PADDING,
            ...style,
          } as React.CSSProperties
        }
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function SidebarMobileSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-[overlayIn_150ms_ease-out] md:hidden"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width-mobile)] max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-lift animate-[dialogIn_180ms_ease-out] md:hidden"
        style={{ "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        role="dialog"
        aria-label="Navigation"
      >
        {children}
      </div>
    </>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  const inner = (
    <div className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-2xl group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-card">
      {children}
    </div>
  );

  if (collapsible === "none") {
    return (
      <div className={cn("flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground", className)} {...props}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <SidebarMobileSheet open={openMobile} onOpenChange={setOpenMobile}>
        {inner}
      </SidebarMobileSheet>
    );
  }

  return (
    <div
      className="group peer hidden shrink-0 text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      <div
        className={cn(
          "sticky top-0 z-20 flex h-svh flex-col overflow-visible transition-[width] duration-200 ease-linear",
          state === "expanded" ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-width-icon)]",
          className
        )}
        {...props}
      >
        <div className="relative flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-2xl group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      data-sidebar="trigger"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground",
        className
      )}
      {...props}
    >
      <PanelLeft size={16} />
      <span className="sr-only">Toggle sidebar</span>
    </button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      data-sidebar="rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border md:flex",
        className
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("relative flex min-w-0 flex-1 flex-col bg-canvas pb-16", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-2 px-[var(--sidebar-padding)] pb-[var(--sidebar-padding)] pt-3.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:pt-5",
        className
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2 p-[var(--sidebar-padding)] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-[var(--sidebar-padding)]",
        className
      )}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="separator" className={cn("mx-2 h-px bg-sidebar-border", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto group-data-[collapsible=icon]:overflow-visible",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col p-[var(--sidebar-padding)] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-[var(--sidebar-padding)]",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1 group-data-[collapsible=icon]:items-center", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />;
}

function sidebarMenuButtonClass(
  size: "default" | "sm" | "lg" = "default",
  isActive = false,
  extra?: string
) {
  return cn(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-[13.5px] font-medium text-sidebar-foreground outline-none transition-[width,padding,background-color]",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!min-w-8 group-data-[collapsible=icon]:!shrink-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0",
    "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    size === "sm" && "h-7 text-xs",
    size === "default" && "h-9",
    size === "lg" && "h-12 text-sm group-data-[collapsible=icon]:!p-0",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
    extra
  );
}

function SidebarMenuButton({
  isActive = false,
  size = "default",
  tooltip,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  isActive?: boolean;
  size?: "default" | "sm" | "lg";
  tooltip?: string;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [showCard, setShowCard] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const { isMobile, state } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  const shouldShowCard = () => {
    if (!tooltip || isMobile) return false;
    if (collapsed) return true;
    const labelEl = buttonRef.current?.querySelector("[data-sidebar-label]");
    return !!labelEl && labelEl.scrollWidth > labelEl.clientWidth;
  };

  const placeCard = () => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ x: rect.right + 8, y: rect.top + rect.height / 2 });
  };

  const card =
    showCard && tooltip ? (
      <div
        className={cn(
          "pointer-events-none",
          "pointer-events-none hover-card rounded-lg px-3 py-2 text-[13px] leading-snug text-ink",
          tooltip.includes("\n") ? "whitespace-pre-line" : collapsed ? "whitespace-nowrap" : "",
          collapsed
            ? "fixed z-[100] max-w-[240px] -translate-y-1/2"
            : "absolute left-0 top-full z-50 mt-1.5 max-w-[260px]"
        )}
        style={collapsed ? { left: coords.x, top: coords.y } : undefined}
      >
        {tooltip}
      </div>
    ) : null;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        if (!shouldShowCard()) return;
        if (collapsed) placeCard();
        setShowCard(true);
      }}
      onMouseLeave={() => setShowCard(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        data-sidebar="menu-button"
        data-active={isActive}
        className={sidebarMenuButtonClass(size, isActive, className)}
        {...props}
      >
        {children}
      </button>
      {collapsed && card ? createPortal(card, document.body) : card}
    </div>
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-sidebar="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-1 text-[13px] text-sidebar-foreground shadow-none outline-none transition",
        "placeholder:text-sidebar-foreground/45",
        "focus-visible:border-sidebar-ring focus-visible:ring-2 focus-visible:ring-sidebar-ring/30",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}
