import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { Button, Modal, Form } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function OverviewCalendar() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRental, setSelectedRental] = useState(null);
  const [editRental, setEditRental] = useState({
    project_number: '',
    product_ids: [],
    start_date: '',
    end_date: '',
  });
  const [newRental, setNewRental] = useState({
    project_number: '',
    product_ids: [],
    start_date: '',
    end_date: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date('2025-05-23')); // Dynamisk dato

  useEffect(() => {
    fetchRentals();
    fetchProducts();
  }, []);

  const fetchRentals = () => {
    axios
      .get('http://localhost:5000/api/rentals')
      .then((res) => {
        console.log('All rentals:', res.data);
        const formattedRentals = res.data.map((rental) => {
          const start = moment(rental.start_date, 'YYYY-MM-DD', true);
          const end = moment(rental.end_date, 'YYYY-MM-DD', true);
          console.log(`Rental ${rental.id}:`, {
            start: start.isValid() ? start.toDate() : null,
            end: end.isValid() ? end.toDate() : null,
            valid: start.isValid() && end.isValid(),
          });
          return {
            id: rental.id,
            title: `${rental.project_number}: ${rental.product_names}`,
            start: start.isValid() ? start.toDate() : null,
            end: end.isValid() ? end.toDate() : null,
          };
        }).filter(rental => rental.start && rental.end);
        setRentals(formattedRentals);
      })
      .catch((err) => {
        console.error('Error fetching rentals:', err);
        alert('Kunne ikke hente utleie: ' + err.message);
      });
  };

  const fetchProducts = () => {
    axios
      .get('http://localhost:5000/api/products')
      .then((res) => {
        console.log('Products fetched:', res.data);
        setProducts(res.data);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        alert('Kunne ikke hente produkter: ' + err.message);
      });
  };

  const addRental = () => {
    if (!newRental.project_number || newRental.product_ids.length === 0) {
      alert('Prosjektnummer og minst ett produkt kreves');
      return;
    }
    axios
      .post('http://localhost:5000/api/rentals', newRental)
      .then((res) => {
        console.log('Rental added:', res.data);
        fetchRentals();
        setNewRental({ project_number: '', product_ids: [], start_date: '', end_date: '' });
        setShowAddModal(false);
      })
      .catch((err) => {
        console.error('Error adding rental:', err);
        alert(err.response?.data?.error || 'Kunne ikke legge til utleie');
      });
  };

  const handleSelectEvent = (event) => {
    axios
      .get(`http://localhost:5000/api/rentals/${event.id}/products`)
      .then((res) => {
        console.log('Products for rental:', res.data);
        setSelectedRental(event);
        setEditRental({
          project_number: event.title.split(':')[0],
          product_ids: res.data.map((p) => p.id),
          start_date: moment(event.start).format('YYYY-MM-DD'),
          end_date: moment(event.end).format('YYYY-MM-DD'),
        });
      })
      .catch((err) => {
        console.error('Error fetching rental products:', err);
        alert('Kunne ikke hente produkter for utleie: ' + err.message);
      });
  };

  const handleEditRental = () => {
    if (!selectedRental || !editRental.project_number || editRental.product_ids.length === 0) {
      alert('Prosjektnummer og minst ett produkt kreves');
      return;
    }
    console.log('Updating rental with id:', selectedRental.id);
    axios
      .put(`http://localhost:5000/api/rentals/${selectedRental.id}`, editRental)
      .then(() => {
        console.log('Rental updated:', selectedRental.id);
        fetchRentals();
        setSelectedRental(null);
      })
      .catch((err) => {
        console.error('Error updating rental:', err);
        alert(err.response?.data?.error || 'Kunde ikke oppdatere utleie');
      });
  };

  const handleDeleteRental = () => {
    if (!selectedRental) return;
    console.log('Attempting to delete rental with id:', selectedRental.id);
    if (window.confirm('Er du sikker på at du vil slette denne utleien?')) {
      axios
        .delete(`http://localhost:5000/api/rentals/${selectedRental.id}`)
        .then(() => {
          console.log('Rental deleted:', selectedRental.id);
          fetchRentals();
          setSelectedRental(null);
        })
        .catch((err) => {
          console.error('Error deleting rental:', err);
          alert('Kunde ikke slette utleie: ' + (err.response?.data?.error || err.message));
        });
    }
  };

  const closeModal = () => {
    setSelectedRental(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewRental({ project_number: '', product_ids: [], start_date: '', end_date: '' });
  };

  const toggleProduct = (productId, isEdit = false) => {
    const setRental = isEdit ? setEditRental : setNewRental;
    const currentRental = isEdit ? editRental : newRental;
    const productIds = currentRental.product_ids.includes(productId)
      ? currentRental.product_ids.filter((id) => id !== productId)
      : [...currentRental.product_ids, productId];
    setRental({ ...currentRental, product_ids: productIds });
  };

  const handleNavigate = (newDate) => {
    console.log('Navigating to date:', newDate);
    setCurrentDate(newDate);
    fetchRentals(); // Hent hendelser for ny periode om nødvendig
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Oversiktskalender</h2>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus me-1"></i> Legg til utleie
        </Button>
      </div>
      {rentals.length === 0 && <p className="text-muted mb-4">Ingen utleie å vise i kalenderen.</p>}
      <Calendar
        localizer={localizer}
        events={rentals}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        date={currentDate}
        onNavigate={handleNavigate}
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        messages={{
          month: 'Måned',
          week: 'Uke',
          day: 'Dag',
          agenda: 'Agenda',
          today: 'I dag',
          previous: 'Forrige',
          next: 'Neste',
        }}
      />
      {/* Modal for redigering/sletting */}
      <Modal show={!!selectedRental} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Rediger utleie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="editProjectNumber">
              <Form.Label>Prosjektnummer</Form.Label>
              <Form.Control
                type="text"
                value={editRental.project_number}
                onChange={(e) => setEditRental({ ...editRental, project_number: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="editProducts">
              <Form.Label>Produkter</Form.Label>
              {products.map((product) => (
                <Form.Check
                  key={product.id}
                  type="checkbox"
                  label={product.name}
                  checked={editRental.product_ids.includes(product.id)}
                  onChange={() => toggleProduct(product.id, true)}
                />
              ))}
            </Form.Group>
            <Form.Group className="mb-3" controlId="editStartDate">
              <Form.Label>Startdato</Form.Label>
              <Form.Control
                type="date"
                value={editRental.start_date}
                onChange={(e) => setEditRental({ ...editRental, start_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="editEndDate">
              <Form.Label>Sluttdato</Form.Label>
              <Form.Control
                type="date"
                value={editRental.end_date}
                onChange={(e) => setEditRental({ ...editRental, end_date: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Avbryt
          </Button>
          <Button variant="primary" onClick={handleEditRental}>
            Lagre endringer
          </Button>
          <Button variant="danger" onClick={handleDeleteRental}>
            Slett utleie
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal for å legge til ny utleie */}
      <Modal show={showAddModal} onHide={closeAddModal}>
        <Modal.Header closeButton>
          <Modal.Title>Legg til ny utleie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="newProjectNumber">
              <Form.Label>Prosjektnummer</Form.Label>
              <Form.Control
                type="text"
                placeholder="Prosjektnummer (f.eks. 102854)"
                value={newRental.project_number}
                onChange={(e) => setNewRental({ ...newRental, project_number: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newProducts">
              <Form.Label>Produkter</Form.Label>
              {products.map((product) => (
                <Form.Check
                  key={product.id}
                  type="checkbox"
                  label={product.name}
                  checked={newRental.product_ids.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                />
              ))}
            </Form.Group>
            <Form.Group className="mb-3" controlId="newStartDate">
              <Form.Label>Startdato</Form.Label>
              <Form.Control
                type="date"
                value={newRental.start_date}
                onChange={(e) => setNewRental({ ...newRental, start_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newEndDate">
              <Form.Label>Sluttdato</Form.Label>
              <Form.Control
                type="date"
                value={newRental.end_date}
                onChange={(e) => setNewRental({ ...newRental, end_date: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAddModal}>
            Avbryt
          </Button>
          <Button variant="primary" onClick={addRental}>
            Lagre utleie
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OverviewCalendar;
