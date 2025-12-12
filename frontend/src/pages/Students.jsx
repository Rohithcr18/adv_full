import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const defaultStudent = {
    rollNumber: '',
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    className: '',
    section: 'A',
    email: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    status: 'Active',
};

const statusOptions = ['Active', 'Graduated', 'On Leave'];
const genderOptions = ['Male', 'Female', 'Other'];

function Students() {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState({ total: 0, status: {}, classes: {} });
    const [formData, setFormData] = useState(defaultStudent);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', className: '', status: '' });

    const classOptions = useMemo(() => {
        const fromSummary = Object.keys(summary.classes || {});
        const fromStudents = [...new Set(students.map((student) => student.className))];
        return Array.from(new Set([...fromSummary, ...fromStudents])).filter(Boolean);
    }, [summary.classes, students]);

    const filteredParams = useMemo(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value?.trim()) {
                params.append(key, value.trim());
            }
        });
        return params.toString();
    }, [filters]);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/students/summary');
            setSummary(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/students${filteredParams ? `?${filteredParams}` : ''}`);
            setStudents(res.data);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [filteredParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData(defaultStudent);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                dateOfBirth: formData.dateOfBirth || null,
            };
            const res = editingId
                ? await api.put(`/students/${editingId}`, payload)
                : await api.post('/students', payload);

            setMessage(editingId ? 'Student updated successfully' : 'Student added successfully');
            resetForm();
            await Promise.all([fetchStudents(), fetchSummary()]);

            if (!editingId) {
                setStudents((prev) => [...prev, res.data]);
            }
        } catch (err) {
            setMessage(err.response?.data?.error || 'Unable to save student');
        }
    };

    const handleEdit = (student) => {
        setEditingId(student._id);
        setFormData({
            rollNumber: student.rollNumber,
            fullName: student.fullName,
            gender: student.gender || 'Other',
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
            className: student.className,
            section: student.section,
            email: student.email,
            phone: student.phone,
            guardianName: student.guardianName,
            guardianPhone: student.guardianPhone,
            address: student.address,
            status: student.status,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this student?')) return;
        try {
            await api.delete(`/students/${id}`);
            setStudents((prev) => prev.filter((student) => student._id !== id));
            setMessage('Student deleted');
            fetchSummary();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Unable to delete student');
        }
    };

    const StatsCard = ({ title, value, accent }) => (
        <div
            style={{
                padding: '1rem 1.5rem',
                borderRadius: 16,
                background: '#fff',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.1)',
                borderTop: `4px solid ${accent}`,
                minWidth: 180,
            }}
        >
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{title}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
                {value}
            </p>
        </div>
    );

    const summaryBadges = Object.entries(summary.status || {}).map(([label, count]) => (
        <span
            key={label}
            style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '0.4rem 0.8rem',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
            }}
        >
            {label}: {count}
        </span>
    ));

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #fdf2e9, #e0f2fe)',
                padding: '2rem',
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    background: '#ffffffee',
                    borderRadius: 24,
                    padding: '2rem',
                    boxShadow: '0 35px 80px rgba(15, 23, 42, 0.15)',
                }}
            >
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#0f172a' }}>
                        Student Management Dashboard
                    </h1>
                    <p style={{ color: '#475569', marginTop: '0.5rem' }}>
                        Track student admissions, guardians, and status across every class.
                    </p>
                </header>

                <section
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '2rem',
                    }}
                >
                    <StatsCard title="Total Students" value={summary.total ?? 0} accent="#f97316" />
                    <StatsCard
                        title="Active"
                        value={summary.status?.Active ?? 0}
                        accent="#22c55e"
                    />
                    <StatsCard
                        title="Graduated"
                        value={summary.status?.Graduated ?? 0}
                        accent="#6366f1"
                    />
                    <StatsCard
                        title="On Leave"
                        value={summary.status?.['On Leave'] ?? 0}
                        accent="#facc15"
                    />
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            alignItems: 'center',
                        }}
                    >
                        <input
                            type="search"
                            placeholder="Search by name, roll, guardian..."
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            style={{
                                flex: 1,
                                minWidth: 240,
                                padding: '0.6rem 0.9rem',
                                borderRadius: 12,
                                border: '1px solid #cbd5f5',
                            }}
                        />
                        <select
                            value={filters.className}
                            onChange={(e) => setFilters((prev) => ({ ...prev, className: e.target.value }))}
                            style={{ padding: '0.6rem', borderRadius: 12, border: '1px solid #cbd5f5' }}
                        >
                            <option value="">All Classes</option>
                            {classOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                            style={{ padding: '0.6rem', borderRadius: 12, border: '1px solid #cbd5f5' }}
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setFilters({ search: '', className: '', status: '' })}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: 12,
                                border: 'none',
                                background: '#0ea5e9',
                                color: '#fff',
                                fontWeight: 600,
                            }}
                        >
                            Reset
                        </button>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {summaryBadges}
                    </div>
                </section>

                <section
                    style={{
                        display: 'grid',
                        gap: '2rem',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        marginBottom: '2rem',
                    }}
                >
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            padding: '1.5rem',
                            borderRadius: 20,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <h2 style={{ marginTop: 0 }}>
                            {editingId ? 'Update Student' : 'Add Student'}
                        </h2>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <input
                                name="rollNumber"
                                placeholder="Roll Number"
                                value={formData.rollNumber}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                name="fullName"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                            />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    style={{ flex: 1 }}
                                >
                                    {genderOptions.map((gender) => (
                                        <option key={gender} value={gender}>
                                            {gender}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input
                                    name="className"
                                    placeholder="Class (e.g., Grade 10)"
                                    value={formData.className}
                                    onChange={handleInputChange}
                                    required
                                    style={{ flex: 1 }}
                                />
                                <input
                                    name="section"
                                    placeholder="Section"
                                    value={formData.section}
                                    onChange={handleInputChange}
                                    style={{ flex: 0.5 }}
                                />
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                name="phone"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                name="guardianName"
                                placeholder="Guardian Name"
                                value={formData.guardianName}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                name="guardianPhone"
                                placeholder="Guardian Phone"
                                value={formData.guardianPhone}
                                onChange={handleInputChange}
                                required
                            />
                            <textarea
                                name="address"
                                placeholder="Address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                                required
                            />
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                            <button
                                type="submit"
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    border: 'none',
                                    borderRadius: 12,
                                    background: '#0ea5e9',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {editingId ? 'Save Changes' : 'Add Student'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        padding: '0.8rem',
                                        borderRadius: 12,
                                        border: '1px solid #cbd5f5',
                                        background: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div
                        style={{
                            padding: '1.5rem',
                            borderRadius: 20,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                        }}
                    >
                        <h2 style={{ marginTop: 0 }}>Class Distribution</h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {Object.entries(summary.classes || {}).map(([className, count]) => (
                                <li
                                    key={className}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.6rem 0',
                                        borderBottom: '1px solid #f1f5f9',
                                    }}
                                >
                                    <span>{className}</span>
                                    <strong>{count}</strong>
                                </li>
                            ))}
                            {!Object.keys(summary.classes || {}).length && (
                                <p style={{ color: '#94a3b8' }}>No class data yet.</p>
                            )}
                        </ul>
                    </div>
                </section>

                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0 }}>Students</h2>
                        {message && <p style={{ color: '#2563eb', margin: 0 }}>{message}</p>}
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                minWidth: 800,
                                borderRadius: 16,
                                overflow: 'hidden',
                            }}
                        >
                            <thead style={{ background: '#0f172a', color: '#fff' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem' }}>Roll</th>
                                    <th>Name</th>
                                    <th>Class</th>
                                    <th>Status</th>
                                    <th>Guardian</th>
                                    <th>Phone</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
                                            Loading students...
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr
                                            key={student._id}
                                            style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}
                                        >
                                            <td style={{ padding: '0.6rem' }}>{student.rollNumber}</td>
                                            <td>{student.fullName}</td>
                                            <td>
                                                {student.className} {student.section && `- ${student.section}`}
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: 999,
                                                        background: '#dbeafe',
                                                        color: '#1d4ed8',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td>{student.guardianName}</td>
                                            <td>{student.phone}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    style={{
                                                        marginRight: 8,
                                                        border: 'none',
                                                        background: '#22c55e',
                                                        color: '#fff',
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 8,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student._id)}
                                                    style={{
                                                        border: 'none',
                                                        background: '#ef4444',
                                                        color: '#fff',
                                                        padding: '0.35rem 0.7rem',
                                                        borderRadius: 8,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Students;
