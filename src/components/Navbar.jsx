import { MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLoggedIn = Boolean(token);
  const showAdmin =
    isLoggedIn &&
    user?.role === 'admin' &&
    user?.name === 'Janani Nagarajan' &&
    String(user?.email || '').toLowerCase() === 'bnajanani258@gmail.com';

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">
          <MapPin className="logo-icon" size={28} />
          <span className="logo-text">CivicFix</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/feed" className="nav-link">Live Feed</Link>
          <Link to="/map" className="nav-link">Live Map</Link>
          <Link to="/track" className="nav-link">Track</Link>
          {showAdmin && <Link to="/admin" className="nav-link">Admin</Link>}

          {isLoggedIn ? (
            <>
              <Link to="/my-complaints" className="nav-link">My Profile</Link>
            </>
          ) : (
            <>
              <Link to="/signup" className="nav-link">Sign Up</Link>
            </>
          )}
        </div>
        <div className="nav-actions">
          {isLoggedIn && (
            <button className="btn btn-secondary nav-btn nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
