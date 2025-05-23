import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import ProductList from './pages/ProductList';
import CalendarView from './pages/CalendarView';
import OverviewCalendar from './pages/OverviewCalendar';
import RentalsView from './pages/RentalsView';
import './styles.css';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <Navbar bg="primary" variant="dark" expand="lg" className="px-4 shadow-sm">
          <Navbar.Brand href="/">Utleiekalender</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">
                <i className="fas fa-box me-1"></i> Produktliste
              </Nav.Link>
              <Nav.Link href="/rentals">
                <i className="fas fa-project-diagram me-1"></i> Utleier/Prosjekter
              </Nav.Link>
              <Nav.Link href="/overview">
                <i className="fas fa-calendar-alt me-1"></i> Oversiktskalender
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/calendar/:productId" element={<CalendarView />} />
            <Route path="/overview" element={<OverviewCalendar />} />
            <Route path="/rentals" element={<RentalsView />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
