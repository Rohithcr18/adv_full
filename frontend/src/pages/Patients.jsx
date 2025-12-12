import { useState, useEffect } from 'react';
import { api } from '../api';

function Patients() {
  const [patients, setPatients] = useState([]);
  const [newPatient, setNewPatient] = useState({
    pid: '',
    pname: '',
    age: '',
    address: '',
    d_id: '',
    d_name: '',
  });
  const [message, setMessage] = useState('');

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to load patients');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...newPatient,
        pid: Number(newPatient.pid),
        age: Number(newPatient.age),
        d_id: Number(newPatient.d_id),
      };
      const res = await api.post('/patients', body);
      setPatients((prev) => [...prev, res.data]);
      setNewPatient({
        pid: '',
        pname: '',
        age: '',
        address: '',
        d_id: '',
        d_name: '',
      });
      setMessage('Patient created');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create patient');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p._id !== id));
      setMessage('Patient deleted');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete patient');
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Patients</h1>
      {message && <p>{message}</p>}

      <section style={{ marginBottom: 30 }}>
        <h2>Add Patient</h2>
        <form onSubmit={handleCreatePatient}>
          <input
            placeholder="PID"
            value={newPatient.pid}
            onChange={(e) => setNewPatient({ ...newPatient, pid: e.target.value })}
          />
          <input
            placeholder="Name"
            value={newPatient.pname}
            onChange={(e) => setNewPatient({ ...newPatient, pname: e.target.value })}
          />
          <input
            placeholder="Age"
            value={newPatient.age}
            onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
          />
          <input
            placeholder="Address"
            value={newPatient.address}
            onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
          />
          <input
            placeholder="Doctor ID"
            value={newPatient.d_id}
            onChange={(e) => setNewPatient({ ...newPatient, d_id: e.target.value })}
          />
          <input
            placeholder="Doctor Name"
            value={newPatient.d_name}
            onChange={(e) => setNewPatient({ ...newPatient, d_name: e.target.value })}
          />
          <button type="submit">Add Patient</button>
        </form>
      </section>

      <section>
        <h2>Patient List</h2>
        {patients.length === 0 ? (
          <p>No patients yet</p>
        ) : (
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>PID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Address</th>
                <th>Doctor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>{p.pid}</td>
                  <td>{p.pname}</td>
                  <td>{p.age}</td>
                  <td>{p.address}</td>
                  <td>{p.d_name}</td>
                  <td>
                    <button onClick={() => handleDelete(p._id)}>Delete</button>
                    {/* For update, you could pre-fill form, etc. */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Patients;
