
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./AdminDashboard.css";

function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [saving, setSaving] = useState(false);

    const [notices, setNotices] = useState([]);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editCategory, setEditCategory] = useState("General");

    const navigate = useNavigate();

    function getCategoryIcon(category) {
        switch (category) {
            case "General":
                return "📢";
            case "Exam":
                return "📝";
            case "Event":
                return "🎉";
            case "Placement":
                return "💼";
            default:
                return "📋";
        }
    }

    function showMessage(text, type = "success") {
        setMessage(text);
        setMessageType(type);

        setTimeout(() => {
            setMessage("");
        }, 3000);
    }

    const totalNotices = notices.length;

    const latestNotice =
        notices.length > 0
            ? new Date(notices[0].created_at).toLocaleDateString()
            : "No notices";

    const categoriesUsed = new Set(
        notices.map((notice) => notice.category)
    ).size;

    const generalCount = notices.filter(
        (notice) => notice.category === "General"
    ).length;

    const examCount = notices.filter(
        (notice) => notice.category === "Exam"
    ).length;

    const eventCount = notices.filter(
        (notice) => notice.category === "Event"
    ).length;

    const placementCount = notices.filter(
        (notice) => notice.category === "Placement"
    ).length;

    const recentNoticesCount = notices.filter((notice) => {
        const noticeDate = new Date(notice.created_at);
        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return noticeDate >= sevenDaysAgo;
    }).length;

    const newestNotice =
        notices.length > 0 ? notices[0] : null;

    const filteredNotices = notices.filter((notice) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            notice.title
                .toLowerCase()
                .includes(searchText) ||
            notice.description
                .toLowerCase()
                .includes(searchText);

        const matchesCategory =
            filterCategory === "All" ||
            notice.category === filterCategory;

        return matchesSearch && matchesCategory;
    });

    async function fetchNotices() {
        const { data, error } = await supabase
            .from("notices")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Fetch Notices Error:", error);
            return;
        }

        setNotices(data || []);
    }

    useEffect(() => {
        let isMounted = true;

        async function loadAdminData() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!isMounted) {
                return;
            }

            if (!user) {
                navigate("/login");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (!isMounted) {
                return;
            }

            if (error || profile?.role !== "admin") {
                navigate("/");
                return;
            }

            setUser(user);
            setChecking(false);

            const {
                data: noticesData,
                error: noticesError,
            } = await supabase
                .from("notices")
                .select("*")
                .order("created_at", { ascending: false });

            if (!isMounted) {
                return;
            }

            if (noticesError) {
                console.error(
                    "Fetch Notices Error:",
                    noticesError
                );
                return;
            }

            setNotices(noticesData || []);
        }

        loadAdminData();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    async function handleCreateNotice(e) {
        e.preventDefault();

        setMessage("");
        setSaving(true);

        const { error } = await supabase
            .from("notices")
            .insert([
                {
                    title,
                    description,
                    category,
                },
            ]);

        setSaving(false);

        if (error) {
            console.error(
                "Create Notice Error:",
                error
            );

            showMessage(
                error.message,
                "error"
            );

            return;
        }

        showMessage(
            "Notice created successfully!",
            "success"
        );

        setTitle("");
        setDescription("");
        setCategory("General");

        fetchNotices();
    }

    async function handleDeleteNotice(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this notice?"
        );

        if (!confirmed) {
            return;
        }

        const { error } = await supabase
            .from("notices")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(
                "Delete Notice Error:",
                error
            );

            showMessage(
                error.message,
                "error"
            );

            return;
        }

        showMessage(
            "Notice deleted successfully!",
            "success"
        );

        fetchNotices();
    }

    async function handleUpdateNotice(id) {
        setMessage("");

        const { error } = await supabase
            .from("notices")
            .update({
                title: editTitle,
                description: editDescription,
                category: editCategory,
            })
            .eq("id", id);

        if (error) {
            console.error(
                "Update Notice Error:",
                error
            );

            showMessage(
                error.message,
                "error"
            );

            return;
        }

        showMessage(
            "Notice updated successfully!",
            "success"
        );

        setEditingId(null);
        setEditTitle("");
        setEditDescription("");
        setEditCategory("General");

        fetchNotices();
    }

    function startEditing(notice) {
        setEditingId(notice.id);
        setEditTitle(notice.title);
        setEditDescription(notice.description);
        setEditCategory(notice.category);
        setMessage("");
    }

    function cancelEditing() {
        setEditingId(null);
        setEditTitle("");
        setEditDescription("");
        setEditCategory("General");
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/login");
    }

    if (checking) {
        return (
            <div className="auth-loading">
                Checking admin access...
            </div>
        );
    }

    return (
        <div className="admin-page">

            {/* ================================
                ADMIN HEADER
            ================================= */}

            <div className="admin-header">

                <div className="admin-header-content">

                    <p className="admin-label">
                        ADMIN PANEL
                    </p>

                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Welcome, {user.email}
                    </p>

                </div>

                <div className="admin-header-actions">

                    <button
                        className="admin-home-button"
                        onClick={() => navigate("/")}
                    >
                        🏠 Student Dashboard
                    </button>

                    <button
                        className="admin-refresh-button"
                        onClick={fetchNotices}
                    >
                        🔄 Refresh
                    </button>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </div>

            {/* ================================
                ADMIN STATISTICS
            ================================= */}

            <div className="admin-stats admin-stats-grid">

                <div className="stat-card">

                    <div className="stat-icon">
                        📢
                    </div>

                    <div>
                        <p>
                            Total Notices
                        </p>

                        <h3>
                            {totalNotices}
                        </h3>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        🕒
                    </div>

                    <div>
                        <p>
                            Latest Notice Date
                        </p>

                        <h3 className="latest-stat">
                            {latestNotice}
                        </h3>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        🏷️
                    </div>

                    <div>
                        <p>
                            Categories Used
                        </p>

                        <h3>
                            {categoriesUsed}
                        </h3>
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-icon">
                        📅
                    </div>

                    <div>
                        <p>
                            Notices This Week
                        </p>

                        <h3>
                            {recentNoticesCount}
                        </h3>
                    </div>

                </div>

            </div>

            {/* ================================
                NEWEST NOTICE
            ================================= */}

            {newestNotice && (

                <div className="newest-notice-card">

                    <div className="newest-notice-icon">
                        📌
                    </div>

                    <div className="newest-notice-content">

                        <span className="newest-notice-label">
                            NEWEST NOTICE
                        </span>

                        <h2>
                            {newestNotice.title}
                        </h2>

                        <p>
                            {newestNotice.description}
                        </p>

                        <div className="newest-notice-meta">

                            <span className="category newest-category">

                                <span className="category-inline-icon">
                                    {getCategoryIcon(
                                        newestNotice.category
                                    )}
                                </span>

                                {newestNotice.category}

                            </span>

                            <span>
                                📅{" "}
                                {new Date(
                                    newestNotice.created_at
                                ).toLocaleDateString()}
                            </span>

                        </div>

                    </div>

                </div>

            )}

            {/* ================================
                CATEGORY SUMMARY
            ================================= */}

            <div className="category-summary">

                <div className="category-summary-card">

                    <span>
                        📢
                    </span>

                    <div>

                        <p>
                            <span className="category-summary-label-icon">
                                📢
                            </span>
                            General
                        </p>

                        <h3>
                            {generalCount}
                        </h3>

                    </div>

                </div>

                <div className="category-summary-card">

                    <span>
                        📝
                    </span>

                    <div>

                        <p>
                            <span className="category-summary-label-icon">
                                📝
                            </span>
                            Exam
                        </p>

                        <h3>
                            {examCount}
                        </h3>

                    </div>

                </div>

                <div className="category-summary-card">

                    <span>
                        🎉
                    </span>

                    <div>

                        <p>
                            <span className="category-summary-label-icon">
                                🎉
                            </span>
                            Event
                        </p>

                        <h3>
                            {eventCount}
                        </h3>

                    </div>

                </div>

                <div className="category-summary-card">

                    <span>
                        💼
                    </span>

                    <div>

                        <p>
                            <span className="category-summary-label-icon">
                                💼
                            </span>
                            Placement
                        </p>

                        <h3>
                            {placementCount}
                        </h3>

                    </div>

                </div>

            </div>

            {/* ================================
                ADMIN CONTENT
            ================================= */}

            <div className="admin-content">

                {/* ================================
                    CREATE NOTICE
                ================================= */}

                <div className="admin-card">

                    <span>
                        📢
                    </span>

                    <h2>
                        Create Notice
                    </h2>

                    <p>
                        Publish a new announcement for students.
                    </p>

                    <form
                        className="notice-form"
                        onSubmit={handleCreateNotice}
                    >

                        <input
                            type="text"
                            placeholder="Notice title"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            required
                        />

                        <textarea
                            placeholder="Notice description"
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            required
                        />

                        <select
                            value={category}
                            onChange={(e) =>
                                setCategory(
                                    e.target.value
                                )
                            }
                        >

                            <option value="General">
                                General
                            </option>

                            <option value="Exam">
                                Exam
                            </option>

                            <option value="Event">
                                Event
                            </option>

                            <option value="Placement">
                                Placement
                            </option>

                        </select>

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Publishing..."
                                : "Publish Notice"}
                        </button>

                    </form>

                    {message && (

                        <div
                            className={`admin-message ${messageType}`}
                        >

                            <span>
                                {messageType === "success" && "✅"}
                                {messageType === "error" && "❌"}
                                {messageType === "info" && "ℹ️"}
                            </span>

                            <p>
                                {message}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setMessage("")
                                }
                                aria-label="Close notification"
                            >
                                ×
                            </button>

                        </div>

                    )}

                </div>

                {/* ================================
                    MANAGE NOTICES
                ================================= */}

                <div className="admin-card">

                    <span>
                        📋
                    </span>

                    <h2>
                        Manage Notices
                    </h2>

                    <p>
                        View and manage all published campus announcements.
                    </p>

                    {/* Search and Filter */}

                    <div className="admin-notice-filters">

                        <div className="admin-search-box">

                            <span
                                className="admin-search-icon"
                                aria-hidden="true"
                            >
                                🔍
                            </span>

                            <input
                                type="text"
                                placeholder="Search notices..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                aria-label="Search notices"
                            />

                            {search && (

                                <button
                                    type="button"
                                    className="admin-search-clear"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>

                            )}

                        </div>

                        <div className="admin-category-filter">

                            <span
                                className="admin-category-filter-icon"
                                aria-hidden="true"
                            >
                                🏷️
                            </span>

                            <select
                                value={filterCategory}
                                onChange={(e) =>
                                    setFilterCategory(
                                        e.target.value
                                    )
                                }
                                aria-label="Filter notices by category"
                            >

                                <option value="All">
                                    All Categories
                                </option>

                                <option value="General">
                                    📢 General
                                </option>

                                <option value="Exam">
                                    📝 Exam
                                </option>

                                <option value="Event">
                                    🎉 Event
                                </option>

                                <option value="Placement">
                                    💼 Placement
                                </option>

                            </select>

                        </div>

                    </div>

                    {/* Filter Result */}

                    <div className="admin-filter-result">

                        <span>
                            Showing{" "}
                            <strong>
                                {filteredNotices.length}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {notices.length}
                            </strong>{" "}
                            notices
                        </span>

                        {(search ||
                            filterCategory !== "All") && (

                            <button
                                type="button"
                                className="admin-clear-filters"
                                onClick={() => {
                                    setSearch("");
                                    setFilterCategory("All");
                                }}
                            >
                                Clear Filters
                            </button>

                        )}

                    </div>

                    {/* Notice List */}

                    <div className="admin-notice-list">

                        {filteredNotices.length === 0 ? (

                            <p className="no-notices">

                                {notices.length === 0
                                    ? "No notices available"
                                    : "No notices match your search or filter"}

                            </p>

                        ) : (

                            filteredNotices.map((notice) => (

                                <div
                                    className="admin-notice-item"
                                    key={notice.id}
                                >

                                    {editingId === notice.id ? (

                                        /* ================================
                                           EDIT FORM
                                        ================================= */

                                        <div className="edit-form">

                                            <div className="edit-form-header">

                                                <span>
                                                    ✏️
                                                </span>

                                                <h3>
                                                    Edit Notice
                                                </h3>

                                            </div>

                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) =>
                                                    setEditTitle(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Notice title"
                                                required
                                            />

                                            <textarea
                                                value={editDescription}
                                                onChange={(e) =>
                                                    setEditDescription(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Notice description"
                                                required
                                            />

                                            <select
                                                value={editCategory}
                                                onChange={(e) =>
                                                    setEditCategory(
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="General">
                                                    General
                                                </option>

                                                <option value="Exam">
                                                    Exam
                                                </option>

                                                <option value="Event">
                                                    Event
                                                </option>

                                                <option value="Placement">
                                                    Placement
                                                </option>

                                            </select>

                                            <div className="edit-actions">

                                                <button
                                                    type="button"
                                                    className="save-edit-button"
                                                    onClick={() =>
                                                        handleUpdateNotice(
                                                            notice.id
                                                        )
                                                    }
                                                >
                                                    💾 Save Changes
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cancel-edit-button"
                                                    onClick={
                                                        cancelEditing
                                                    }
                                                >
                                                    ❌ Cancel
                                                </button>

                                            </div>

                                        </div>

                                    ) : (

                                        /* ================================
                                           NOTICE DISPLAY
                                        ================================= */

                                        <div className="admin-notice-info">

                                            <span className="category notice-list-category">

                                                <span className="category-inline-icon">
                                                    {getCategoryIcon(
                                                        notice.category
                                                    )}
                                                </span>

                                                {notice.category}

                                            </span>

                                            <h3>
                                                {notice.title}
                                            </h3>

                                            <p>
                                                {notice.description}
                                            </p>

                                            <small>
                                                📅{" "}
                                                {new Date(
                                                    notice.created_at
                                                ).toLocaleDateString()}
                                            </small>

                                            <div className="admin-notice-actions">

                                                <button
                                                    type="button"
                                                    className="edit-button"
                                                    onClick={() =>
                                                        startEditing(
                                                            notice
                                                        )
                                                    }
                                                >
                                                    ✏️ Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDeleteNotice(
                                                            notice.id
                                                        )
                                                    }
                                                >
                                                    🗑️ Delete
                                                </button>

                                            </div>

                                        </div>

                                    )}

                                </div>

                            ))

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AdminDashboard;

