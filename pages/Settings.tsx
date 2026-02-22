import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, User, Mail, Camera, Save, Loader2, Lock, Shield, Key, Bell, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useQuizStore } from '../store/QuizContext';
import { useTranslation } from '../hooks/useTranslation';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences';

export const Settings: React.FC = () => {
  const { user, deleteAccount, updateUserProfile, updateUserPassword, uploadAvatar } = useAuth();
  const { deleteAllQuizzesByAuthor } = useQuizStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false); // Mock state for now

  // Notification State
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    activitySummary: true
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Preferences State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      if (user.notifications) {
        setNotifications(user.notifications);
      }
      if (user.preferences) {
        setTheme(user.preferences.theme);
        setLanguage(user.preferences.language);
      }
    }
  }, [user]);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và sẽ xóa tất cả bài trắc nghiệm bạn đã đăng.')) {
      return;
    }

    try {
      await deleteAllQuizzesByAuthor(user.id);
      await deleteAccount();
      navigate('/');
      alert("Tài khoản của bạn đã được xóa thành công.");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      alert("Không thể xóa tài khoản. Vui lòng đăng nhập lại và thử lại. (Lỗi bảo mật Firebase yêu cầu đăng nhập gần đây để xóa tài khoản)");
    }
  };

  // Handle file change for avatar upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const photoURL = await uploadAvatar(file);
      await updateUserProfile({ photoURL });
      alert("Đã cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      alert("Tên không được để trống.");
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUserProfile({ name, bio });
      alert("Đã cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Lỗi khi cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      alert("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await updateUserPassword(currentPassword, newPassword);
      alert("Đã đổi mật khẩu thành công!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.code === 'auth/wrong-password') {
        alert("Mật khẩu hiện tại không đúng.");
      } else if (error.code === 'auth/requires-recent-login') {
        alert("Để bảo mật, vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.");
      } else {
        alert("Lỗi khi đổi mật khẩu: " + error.message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsSavingNotifications(true);
      await updateUserProfile({ notifications });
      alert("Đã cập nhật cài đặt thông báo thành công!");
    } catch (error) {
      console.error("Error updating notifications:", error);
      alert("Lỗi khi cập nhật thông báo. Vui lòng thử lại.");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      await updateUserProfile({ preferences: { theme, language } });
      alert("Đã cập nhật tùy chọn thành công!");
    } catch (error) {
      console.error("Error updating preferences:", error);
      alert("Lỗi khi cập nhật tùy chọn. Vui lòng thử lại.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12 dark:text-white">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vui lòng đăng nhập</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto dark:text-slate-100">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('settings.title')}</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden transition-colors">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-3 text-left text-sm font-medium flex items-center space-x-3 transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
                }`}
              >
                <User className="h-5 w-5" />
                <span>{t('settings.profile')}</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-3 text-left text-sm font-medium flex items-center space-x-3 transition-colors ${
                  activeTab === 'security' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>{t('settings.security')}</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-3 text-left text-sm font-medium flex items-center space-x-3 transition-colors ${
                  activeTab === 'notifications' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
                }`}
              >
                <Bell className="h-5 w-5" />
                <span>{t('settings.notifications')}</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-4 py-3 text-left text-sm font-medium flex items-center space-x-3 transition-colors ${
                  activeTab === 'preferences' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
                }`}
              >
                <Globe className="h-5 w-5" />
                <span>{t('settings.preferences')}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <>
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('settings.profile.title')}</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-md">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-2xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Thay đổi ảnh đại diện"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <h4 className="text-base font-medium text-slate-900 dark:text-white">{user.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        Nhấp vào biểu tượng máy ảnh để thay đổi ảnh đại diện.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('settings.profile.name')}
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2"
                          placeholder="Nhập tên hiển thị của bạn"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('settings.profile.bio')}
                      </label>
                      <textarea
                        id="bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md p-2"
                        placeholder={t('settings.profile.bioPlaceholder')}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            {t('settings.saving')}
                          </>
                        ) : (
                          <>
                            <Save className="-ml-1 mr-2 h-4 w-4" />
                            {t('settings.save')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-red-100 dark:border-red-900/30">
                <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-300">{t('settings.profile.danger')}</h3>
                </div>
                <div className="p-6">
                  <h4 className="text-base font-medium text-slate-900 dark:text-white">{t('settings.profile.delete')}</h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t('settings.profile.deleteDesc')}
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium text-sm flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('settings.profile.deleteBtn')}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('settings.security.title')}</h3>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Change Password */}
                <div>
                  <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2 text-slate-500" />
                    {t('settings.password.title')}
                  </h4>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('settings.password.current')}
                      </label>
                      <input
                        type="password"
                        id="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 px-3"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('settings.password.new')}
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 px-3"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('settings.password.confirm')}
                      </label>
                      <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 px-3"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isChangingPassword || !newPassword}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          {t('settings.password.updating')}
                        </>
                      ) : (
                        t('settings.password.update')
                      )}
                    </button>
                  </form>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                  <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-slate-500" />
                    {t('settings.2fa.title')}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('settings.2fa.desc')}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {t('settings.2fa.soon')}
                      </p>
                    </div>
                    <button
                      disabled
                      className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-not-allowed transition-colors ease-in-out duration-200 focus:outline-none bg-slate-200 dark:bg-slate-700"
                    >
                      <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('settings.notifications.title')}</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-slate-900 dark:text-white">{t('settings.notifications.email')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.notifications.emailDesc')}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('email')}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${notifications.email ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${notifications.email ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-slate-900 dark:text-white">{t('settings.notifications.push')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.notifications.pushDesc')}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('push')}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${notifications.push ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${notifications.push ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-slate-900 dark:text-white">{t('settings.notifications.activity')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.notifications.activityDesc')}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('activitySummary')}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${notifications.activitySummary ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${notifications.activitySummary ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifications}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSavingNotifications ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        {t('settings.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        {t('settings.save')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('settings.preferences')}</h3>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Theme Selection */}
                <div>
                  <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4">{t('settings.theme')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center p-4 border rounded-lg space-x-2 transition-all ${
                        theme === 'light' 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                      <span>{t('settings.light')}</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center p-4 border rounded-lg space-x-2 transition-all ${
                        theme === 'dark' 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                      <span>{t('settings.dark')}</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex items-center justify-center p-4 border rounded-lg space-x-2 transition-all ${
                        theme === 'system' 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Monitor className="h-5 w-5" />
                      <span>{t('settings.system')}</span>
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                  <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4">{t('settings.language')}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="lang-vi"
                        name="language"
                        type="radio"
                        checked={language === 'vi'}
                        onChange={() => setLanguage('vi')}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                      <label htmlFor="lang-vi" className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tiếng Việt
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="lang-en"
                        name="language"
                        type="radio"
                        checked={language === 'en'}
                        onChange={() => setLanguage('en')}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                      <label htmlFor="lang-en" className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        English
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSavingPreferences}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSavingPreferences ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        {t('settings.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        {t('settings.save')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
