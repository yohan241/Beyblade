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
import Button from "@mui/material/Button";


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
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              LOGO
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              
            </Box>
            
            <Button color="inherit">Login</Button>
          </Toolbar>
        </AppBar>
      </Box>

      <main className="page-content">
        <Outlet />
      </main>

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
