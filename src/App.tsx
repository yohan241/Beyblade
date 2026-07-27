import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AddBeyPage } from './pages/AddBeyPage'
import { AddEventPage } from './pages/AddEventPage'
import { BeysPage } from './pages/BeysPage'
import { EditBeyPage } from './pages/EditBeyPage'
import { EditEventPage } from './pages/EditEventPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate replace to="/events" />} />

          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<AddEventPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="events/:eventId/edit" element={<EditEventPage />} />

          <Route path="leaderboard" element={<LeaderboardPage />} />

          <Route path="beys" element={<BeysPage />} />
          <Route path="beys/new" element={<AddBeyPage />} />
          <Route path="beys/:beyId/edit" element={<EditBeyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
