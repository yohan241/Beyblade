import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import EventIcon from "@mui/icons-material/Event";
import AllOutIcon from "@mui/icons-material/AllOut";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const NAV_ITEMS = [
  { label: "Leaderboard", value: "/leaderboard", Icon: LeaderboardIcon },
  { label: "Events",      value: "/events",      Icon: EventIcon },
  { label: "Beys",        value: "/beys",        Icon: AllOutIcon },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationValue = location.pathname.startsWith("/events")
    ? "/events"
    : location.pathname.startsWith("/beys")
      ? "/beys"
      : "/leaderboard";

  return (
    <div className="app-layout">
      {/* ── Top bar ── */}
      <Box sx={{ flexGrow: 1 }} className="app-topbar">
        <AppBar
          position="static"
          sx={{
            background: 'linear-gradient(115deg, #14101b 0%, #271633 55%, #14101b 100%)',
            borderBottom: '1px solid #87509b',
            boxShadow: '0 0.5rem 1.5rem rgb(0 0 0 / 35%)',
          }}
        >
          <Toolbar disableGutters>
            <Typography
              className="app-title"
              variant="h6"
              noWrap
              sx={{
                mr: 2,
                fontFamily: '"Permanent Marker", cursive',
                fontWeight: 400,
                letterSpacing: ".08rem",
                color: "#f7c94c",
                paddingLeft: "16px",
              }}
            >
              BEYTRACK
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>

      {/* ── Desktop sidebar (hidden on mobile via CSS) ── */}
      <nav className="desktop-sidenav" aria-label="Main navigation">
        <div className="sidenav-logo" aria-hidden="true">⬡</div>
        {NAV_ITEMS.map(({ label, value, Icon }) => (
          <button
            key={value}
            className={`sidenav-link${navigationValue === value ? ' sidenav-link-active' : ''}`}
            onClick={() => navigate(value)}
            type="button"
          >
            <Icon className="sidenav-icon" fontSize="small" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Page content ── */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <BottomNavigation
        className="bottom-navigation"
        showLabels
        value={navigationValue}
        onChange={(_event, newPath) => {
          navigate(newPath);
        }}
      >
        <BottomNavigationAction
          label="Leaderboard"
          value="/leaderboard"
          icon={<LeaderboardIcon />}
        />
        <BottomNavigationAction
          label="Events"
          value="/events"
          icon={<EventIcon />}
        />
        <BottomNavigationAction
          label="Beys"
          value="/beys"
          icon={<AllOutIcon />}
        />
      </BottomNavigation>
    </div>
  );
}
