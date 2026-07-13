import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { BeysPage } from './pages/BeysPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { FormPlaceholderPage } from './pages/FormPlaceholderPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate replace to="/events" />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="events/new" element={<FormPlaceholderPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="beys" element={<BeysPage />} />
          <Route path="beys/new" element={<FormPlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
