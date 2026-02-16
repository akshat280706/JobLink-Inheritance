import { Link,useLocation } from 'react-router-dom';
import { LogOut, User, Briefcase } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';


const Navbar = () => {
  const { logout } = useAuthStore();
  const { profile, isAuthenticated } = useAuth();
  const location = useLocation();

  const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/privacy-policy',
  '/terms-of-service',
  '/contact'
];

const isPublicPage = publicPaths.includes(location.pathname);


  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Main Navbar */}
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/logo1.png" 
            alt="JobLink" 
          className="h-12 w-auto object-contain"
        />
    </Link>


          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated || isPublicPage ? (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle avatar hover:bg-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center overflow-hidden">
                    {profile?.profile_pic ? (
                      <img src={profile.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                </label>
                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-white rounded-lg w-60 border border-gray-200">
                  <li className="menu-title px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-semibold">{profile?.full_name}</span>
                      <span className="text-xs text-gray-500 capitalize">{profile?.user_type}</span>
                    </div>
                  </li>
                  <div className="divider my-1"></div>
                  <li>
                    <Link 
                      to={profile?.user_type === 'candidate' ? '/candidate/profile' : '/company/profile'}
                      className="hover:bg-gray-100 rounded-lg"
                    >
                      <User className="w-4 h-4" /> 
                      <span>My Profile</span>
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="hover:bg-red-50 text-red-600 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" /> 
                      <span>Sign Out</span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="btn btn-ghost text-gray-700 hover:bg-gray-100 rounded-md">
                  Sign In
                </Link>
                <Link to="/signup" className="btn bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-md">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;