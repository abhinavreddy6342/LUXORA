import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LogOut,
  Mail,
  Package,
  Phone,
  User,
  MapPin,
  CreditCard,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  Heart,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";

function Account() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    wishlistCount,
  } = useShop();

  const [activeTab, setActiveTab] = useState("PROFILE");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const user = authUser || JSON.parse(
    localStorage.getItem("luxoraCurrentUser") ||
      localStorage.getItem("luxora_current_user") ||
      "null"
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      isDefault: addr.isDefault || false,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressForm.name.trim() || !addressForm.address.trim() || !addressForm.city.trim() || !addressForm.pincode.trim()) {
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, addressForm);
    } else {
      addAddress(addressForm);
    }

    setAddressForm({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowAddressModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
        <header className="border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
            <Link to="/" className="text-xl font-extrabold tracking-[-0.07em]">
              LUXORA
            </Link>

            <Link
              to="/"
              className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              <ArrowLeft size={13} />
              BACK TO STORE
            </Link>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-74px)] items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-[460px] text-center"
          >
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              ACCOUNT REQUIRED
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
              Sign in first.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Sign in to access your LUXORA account, personal information, addresses and orders.
            </p>

            <Link
              to="/login"
              className="group mt-9 inline-flex items-center gap-4 bg-black px-8 py-4 text-[10px] font-semibold tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              SIGN IN
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <div className="mt-8">
              <Link
                to="/create-account"
                className="mono text-[9px] tracking-[0.15em] text-neutral-500 underline-offset-4 hover:text-black hover:underline"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const tabs = [
    { key: "PROFILE", label: "PROFILE", icon: User },
    { key: "ORDERS", label: "ORDERS", icon: Package },
    { key: "WISHLIST", label: "WISHLIST", icon: Heart },
    { key: "ADDRESSES", label: "ADDRESSES", icon: MapPin },
    { key: "PAYMENT", label: "PAYMENT", icon: CreditCard },
    { key: "PREFERENCES", label: "PREFERENCES", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link to="/" className="text-xl font-extrabold tracking-[-0.07em]">
            LUXORA
          </Link>

          <Link
            to="/"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            BACK TO STORE
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* TITLE & SIGN OUT */}
          <div className="border-b border-black/10 pb-8">
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              MY LUXORA DASHBOARD
            </p>

            <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.07em] md:text-5xl">
                  Hello, {user.name || user.firstName || "Member"}.
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Manage your profile, saved addresses, orders, and preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mono inline-flex w-fit items-center gap-3 border border-black/15 px-5 py-3 text-[9px] tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
              >
                <LogOut size={13} strokeWidth={1.5} />
                SIGN OUT
              </button>
            </div>
          </div>

          {/* ACCOUNT TABS */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-black/10 pb-4">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`mono flex items-center gap-2 px-5 py-3 text-[9px] tracking-[0.15em] transition-all ${
                    isActive
                      ? "bg-black text-white"
                      : "border border-black/10 bg-white text-neutral-500 hover:border-black hover:text-black"
                  }`}
                >
                  <IconComp size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div className="mt-8">
            {/* PROFILE TAB */}
            {activeTab === "PROFILE" && (
              <section className="border border-black/10 bg-white p-8 max-w-2xl">
                <h2 className="text-xl font-semibold tracking-[-0.04em] mb-6">
                  Personal Information
                </h2>

                <div className="space-y-6 text-sm">
                  <div className="flex items-center gap-4">
                    <User size={16} className="text-neutral-400" />
                    <div>
                      <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">NAME</p>
                      <p className="font-medium mt-0.5">{user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Mail size={16} className="text-neutral-400" />
                    <div>
                      <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">EMAIL</p>
                      <p className="font-medium mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Phone size={16} className="text-neutral-400" />
                    <div>
                      <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">PHONE</p>
                      <p className="font-medium mt-0.5">{user.phone || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ORDERS TAB */}
            {activeTab === "ORDERS" && (
              <section className="border border-black/10 bg-white p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.04em]">My Orders</h2>
                    <p className="text-xs text-neutral-500 mt-1">View order history and track shipments.</p>
                  </div>
                  <Link
                    to="/orders"
                    className="bg-black px-6 py-3 text-[9px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors"
                  >
                    VIEW ALL ORDERS →
                  </Link>
                </div>
              </section>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "WISHLIST" && (
              <section className="border border-black/10 bg-white p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.04em]">Saved Favourites</h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      You have {wishlistCount} saved {wishlistCount === 1 ? "item" : "items"}.
                    </p>
                  </div>
                  <Link
                    to="/wishlist"
                    className="bg-black px-6 py-3 text-[9px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors"
                  >
                    GO TO WISHLIST →
                  </Link>
                </div>
              </section>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === "ADDRESSES" && (
              <section className="border border-black/10 bg-white p-8">
                <div className="flex items-center justify-between border-b border-black/10 pb-6 mb-8">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.04em]">Saved Addresses</h2>
                    <p className="text-xs text-neutral-500 mt-1">Manage shipping locations for faster checkout.</p>
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Plus size={14} />
                    ADD ADDRESS
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-12 text-center">
                    <MapPin size={30} className="mx-auto text-neutral-300" />
                    <p className="mt-3 text-xs text-neutral-500">No saved addresses yet.</p>
                    <button
                      onClick={handleOpenAddModal}
                      className="mt-4 border border-black px-5 py-2.5 text-[9px] font-semibold tracking-[0.15em] hover:bg-black hover:text-white transition-colors"
                    >
                      ADD FIRST ADDRESS
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`border p-6 relative flex flex-col justify-between ${
                          addr.isDefault ? "border-black bg-[#fafaf9]" : "border-black/15 bg-white"
                        }`}
                      >
                        <div>
                          {addr.isDefault && (
                            <span className="mono text-[8px] tracking-[0.15em] bg-black text-white px-2 py-0.5 inline-block mb-3">
                              DEFAULT ADDRESS
                            </span>
                          )}
                          <p className="font-semibold text-sm">{addr.name}</p>
                          <p className="text-xs text-neutral-600 mt-2 leading-5">{addr.address}</p>
                          <p className="text-xs text-neutral-600">
                            {addr.city}, {addr.state} {addr.pincode}
                          </p>
                          {addr.phone && <p className="text-xs text-neutral-400 mt-2">{addr.phone}</p>}
                        </div>

                        <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between gap-3">
                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="mono text-[8px] tracking-[0.12em] text-neutral-500 hover:text-black"
                            >
                              SET AS DEFAULT
                            </button>
                          )}
                          <div className="flex items-center gap-3 ml-auto">
                            <button
                              onClick={() => handleOpenEditModal(addr)}
                              className="mono text-[8px] tracking-[0.12em] text-neutral-600 hover:text-black"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => deleteAddress(addr.id)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* PAYMENT TAB */}
            {activeTab === "PAYMENT" && (
              <section className="border border-black/10 bg-white p-8 max-w-2xl">
                <h2 className="text-xl font-semibold tracking-[-0.04em] mb-4">Payment Methods</h2>
                <p className="text-xs text-neutral-500 leading-6">
                  LUXORA supports Cash on Delivery, UPI, and major credit cards. Payment preferences are selected during checkout.
                </p>
                <div className="mt-6 border border-black/10 bg-[#fafaf9] p-4 flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                  <span className="text-xs font-medium">Cash on Delivery enabled for all orders.</span>
                </div>
              </section>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === "PREFERENCES" && (
              <section className="border border-black/10 bg-white p-8 max-w-2xl">
                <h2 className="text-xl font-semibold tracking-[-0.04em] mb-4">Preferences</h2>
                <div className="space-y-4 text-xs">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-black" />
                    <span>Receive news regarding new seasonal collections</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-black" />
                    <span>Receive SMS notifications for order tracking</span>
                  </label>
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </main>

      {/* ADD / EDIT ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddressModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#fafaf9] border border-black/10 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-black"
            >
              <X size={18} />
            </button>

            <p className="mono text-[9px] tracking-[0.2em] text-neutral-500">SAVED ADDRESSES</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {editingAddressId ? "Edit Address" : "Add New Address"}
            </h3>

            <form onSubmit={handleSaveAddress} className="mt-6 space-y-4">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={addressForm.name}
                onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                className="w-full border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"
              />
              <input
                type="tel"
                placeholder="10-digit Phone Number"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                className="w-full border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"
              />
              <input
                type="text"
                required
                placeholder="Street Address"
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                className="w-full border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"
                />
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit PIN Code"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                className="w-full border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"
              />
              <label className="flex items-center gap-2 text-xs cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="accent-black"
                />
                <span>Set as default address</span>
              </label>

              <button
                type="submit"
                className="w-full bg-black py-4 text-[10px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors mt-4"
              >
                SAVE ADDRESS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;