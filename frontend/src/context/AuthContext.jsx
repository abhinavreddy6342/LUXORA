/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

/* =====================================================
   API CONFIGURATION
===================================================== */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://luxora-backend-9fsz.onrender.com";

/* =====================================================
   LOCAL STORAGE KEYS
===================================================== */

const ACCESS_TOKEN_KEY = "luxora_access_token";
const CURRENT_USER_KEY = "luxoraCurrentUser";
const LEGACY_CURRENT_USER_KEY = "luxora_current_user";

/* =====================================================
   HELPERS
===================================================== */

const safeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
};

const getStoredToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  } catch (error) {
    console.error("Failed to read access token:", error);
    return "";
  }
};

const saveToken = (token) => {
  try {
    if (!token) {
      return false;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, token);

    return true;
  } catch (error) {
    console.error("Failed to save access token:", error);

    return false;
  }
};

const removeToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove access token:", error);
  }
};

const saveCurrentUser = (user) => {
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(LEGACY_CURRENT_USER_KEY);

      return true;
    }

    const serializedUser = JSON.stringify(user);

    localStorage.setItem(
      CURRENT_USER_KEY,
      serializedUser
    );

    localStorage.setItem(
      LEGACY_CURRENT_USER_KEY,
      serializedUser
    );

    return true;
  } catch (error) {
    console.error("Failed to save current user:", error);

    return false;
  }
};

const removeCurrentUser = () => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(LEGACY_CURRENT_USER_KEY);
  } catch (error) {
    console.error("Failed to remove current user:", error);
  }
};

const getStoredCurrentUser = () => {
  try {
    const raw =
      localStorage.getItem(CURRENT_USER_KEY) ||
      localStorage.getItem(LEGACY_CURRENT_USER_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return normalizeUser(parsed);
  } catch (error) {
    console.error(
      "Failed to read stored current user:",
      error
    );

    return null;
  }
};

/* =====================================================
   VALIDATORS
===================================================== */

const isValidGmail = (email) => {
  const cleanEmail = safeString(email)
    .trim()
    .toLowerCase();

  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(
    cleanEmail
  );
};

const isValidPhone = (phone) => {
  const cleanPhone = safeString(phone).replace(
    /\D/g,
    ""
  );

  return /^\d{10}$/.test(cleanPhone);
};

/* =====================================================
   API ERROR HELPER
===================================================== */

const getApiErrorMessage = async (
  response,
  fallbackMessage
) => {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      const messages = data.detail
        .map((item) => item?.msg)
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch (error) {
    console.error(
      "Failed to parse API error response:",
      error
    );
  }

  return fallbackMessage;
};

/* =====================================================
   NORMALIZE USER
===================================================== */

function normalizeUser(userData) {
  if (!userData || typeof userData !== "object") {
    return null;
  }

  const name = safeString(userData.name).trim();

  const firstName = safeString(
    userData.firstName
  ).trim();

  const lastName = safeString(
    userData.lastName
  ).trim();

  const combinedName =
    `${firstName} ${lastName}`.trim();

  const finalName =
    name ||
    combinedName ||
    "User";

  const email = safeString(
    userData.email
  )
    .trim()
    .toLowerCase();

  if (!email) {
    return null;
  }

  return {
    ...userData,
    name: finalName,
    email,
  };
}

/* =====================================================
   AUTH PROVIDER
===================================================== */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ===================================================
     GET CURRENT USER
  =================================================== */

  const fetchCurrentUser = async (token) => {
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/me`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          removeToken();
          removeCurrentUser();
        }

        return null;
      }

      const userData = await response.json();

      return normalizeUser(userData);
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error
      );

      return null;
    }
  };

  /* ===================================================
     RESTORE LOGIN SESSION
  =================================================== */

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = getStoredToken();

      if (!token) {
        const storedUser =
          getStoredCurrentUser();

        if (isMounted) {
          setUser(storedUser);
          setIsLoading(false);
        }

        return;
      }

      const currentUser =
        await fetchCurrentUser(token);

      if (!isMounted) {
        return;
      }

      if (currentUser) {
        setUser(currentUser);
        saveCurrentUser(currentUser);
      } else {
        setUser(null);
        removeToken();
        removeCurrentUser();
      }

      setIsLoading(false);
    };

    restoreSession();

    const handleAuthChanged = () => {
      restoreSession();
    };

    const handleStorage = (event) => {
      if (
        event.key === ACCESS_TOKEN_KEY ||
        event.key === CURRENT_USER_KEY ||
        event.key === LEGACY_CURRENT_USER_KEY
      ) {
        restoreSession();
      }
    };

    window.addEventListener(
      "luxoraAuthChanged",
      handleAuthChanged
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        "luxoraAuthChanged",
        handleAuthChanged
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* ===================================================
     REGISTER
  =================================================== */

  const register = async (
    registrationData = {}
  ) => {
    const firstNameInput = safeString(
      registrationData.firstName
    ).trim();

    const lastNameInput = safeString(
      registrationData.lastName
    ).trim();

    const fullNameInput = safeString(
      registrationData.name
    ).trim();

    const emailInput = safeString(
      registrationData.email
    )
      .trim()
      .toLowerCase();

    const phoneInput = safeString(
      registrationData.phone
    ).replace(/\D/g, "");

    const passwordInput = safeString(
      registrationData.password
    );

    let finalFirstName = firstNameInput;
    let finalLastName = lastNameInput;

    if (
      !finalFirstName &&
      !finalLastName &&
      fullNameInput
    ) {
      const nameParts =
        fullNameInput.split(/\s+/);

      finalFirstName =
        nameParts.shift() || "";

      finalLastName =
        nameParts.join(" ") || "";
    }

    const finalFullName =
      fullNameInput ||
      `${finalFirstName} ${finalLastName}`.trim();

    if (!finalFullName) {
      return {
        success: false,
        message:
          "Please enter your full name.",
        error:
          "Please enter your full name.",
      };
    }

    if (finalFullName.length < 2) {
      return {
        success: false,
        message:
          "Please enter a valid name.",
        error:
          "Please enter a valid name.",
      };
    }

    if (!emailInput) {
      return {
        success: false,
        message:
          "Please enter your Gmail address.",
        error:
          "Please enter your Gmail address.",
      };
    }

    if (!isValidGmail(emailInput)) {
      return {
        success: false,
        message:
          "Please use a valid Gmail address ending with @gmail.com.",
        error:
          "Please use a valid Gmail address ending with @gmail.com.",
      };
    }

    if (!phoneInput) {
      return {
        success: false,
        message:
          "Please enter your phone number.",
        error:
          "Please enter your phone number.",
      };
    }

    if (!isValidPhone(phoneInput)) {
      return {
        success: false,
        message:
          "Phone number must contain exactly 10 digits.",
        error:
          "Phone number must contain exactly 10 digits.",
      };
    }

    if (!passwordInput) {
      return {
        success: false,
        message:
          "Please enter a password.",
        error:
          "Please enter a password.",
      };
    }

    if (passwordInput.length < 8) {
      return {
        success: false,
        message:
          "Password must contain at least 8 characters.",
        error:
          "Password must contain at least 8 characters.",
      };
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            name: finalFullName,
            email: emailInput,
            phone: phoneInput,
            password: passwordInput,
          }),
        }
      );

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to create your account. Please try again."
          );

        return {
          success: false,
          message,
          error: message,
        };
      }

      const createdUser =
        await response.json();

      const normalizedUser =
        normalizeUser(createdUser);

      return {
        success: true,
        message:
          "Account created successfully.",
        user: normalizedUser,
      };
    } catch (error) {
      console.error(
        "Registration request failed:",
        error
      );

      return {
        success: false,
        message:
          "Unable to connect to the LUXORA server. Please try again.",
        error:
          "Unable to connect to the LUXORA server. Please try again.",
      };
    }
  };

  /* ===================================================
     LOGIN
  =================================================== */

  const login = async (loginData = {}) => {
    const email = safeString(
      loginData.email
    )
      .trim()
      .toLowerCase();

    const password = safeString(
      loginData.password
    );

    if (!email) {
      return {
        success: false,
        message:
          "Please enter your Gmail address.",
        error:
          "Please enter your Gmail address.",
      };
    }

    if (!isValidGmail(email)) {
      return {
        success: false,
        message:
          "Please enter a valid Gmail address.",
        error:
          "Please enter a valid Gmail address.",
      };
    }

    if (!password) {
      return {
        success: false,
        message:
          "Please enter your password.",
        error:
          "Please enter your password.",
      };
    }

    try {
      const formData =
        new URLSearchParams();

      formData.append(
        "username",
        email
      );

      formData.append(
        "password",
        password
      );

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept: "application/json",
          },

          body: formData.toString(),
        }
      );

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to sign in. Please check your details."
          );

        return {
          success: false,
          message,
          error: message,
        };
      }

      const data =
        await response.json();

      const accessToken = safeString(
        data?.access_token
      ).trim();

      if (!accessToken) {
        return {
          success: false,
          message:
            "Login succeeded, but the server did not return an access token.",
          error:
            "Login succeeded, but the server did not return an access token.",
        };
      }

      const tokenSaved =
        saveToken(accessToken);

      if (!tokenSaved) {
        return {
          success: false,
          message:
            "Unable to save your login session. Please try again.",
          error:
            "Unable to save your login session. Please try again.",
        };
      }

      let loggedInUser =
        normalizeUser(data?.user);

      if (!loggedInUser) {
        loggedInUser =
          await fetchCurrentUser(
            accessToken
          );
      }

      if (!loggedInUser) {
        removeToken();
        removeCurrentUser();

        return {
          success: false,
          message:
            "Login succeeded, but the user profile could not be loaded.",
          error:
            "Login succeeded, but the user profile could not be loaded.",
        };
      }

      setUser(loggedInUser);

      saveCurrentUser(
        loggedInUser
      );

      window.dispatchEvent(
        new Event("luxoraAuthChanged")
      );

      return {
        success: true,
        message: "Login successful.",
        user: loggedInUser,
        accessToken,
      };
    } catch (error) {
      console.error(
        "Login request failed:",
        error
      );

      return {
        success: false,
        message:
          "Unable to connect to the LUXORA server. Please try again.",
        error:
          "Unable to connect to the LUXORA server. Please try again.",
      };
    }
  };

  /* ===================================================
     LOGOUT
  =================================================== */

  const logout = () => {
    setUser(null);

    removeToken();
    removeCurrentUser();

    window.dispatchEvent(
      new Event("luxoraAuthChanged")
    );
  };

  /* ===================================================
     UPDATE PASSWORD
  =================================================== */

  const updatePassword = async (
    emailInput,
    newPasswordInput
  ) => {
    const cleanEmail = safeString(
      emailInput
    )
      .trim()
      .toLowerCase();

    const newPassword = safeString(
      newPasswordInput
    );

    if (!cleanEmail) {
      return {
        success: false,
        message:
          "Please enter your Gmail address.",
        error:
          "Please enter your Gmail address.",
      };
    }

    if (!isValidGmail(cleanEmail)) {
      return {
        success: false,
        message:
          "Please enter a valid Gmail address.",
        error:
          "Please enter a valid Gmail address.",
      };
    }

    if (!newPassword) {
      return {
        success: false,
        message:
          "Please enter your new password.",
        error:
          "Please enter your new password.",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message:
          "Password must contain at least 8 characters.",
        error:
          "Password must contain at least 8 characters.",
      };
    }

    return {
      success: false,
      message:
        "Password reset is not connected to the backend yet.",
      error:
        "Password reset is not connected to the backend yet.",
    };
  };

  /* ===================================================
     FIND USER
  =================================================== */

  const userExists = async (
    emailInput
  ) => {
    const cleanEmail = safeString(
      emailInput
    )
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      return false;
    }

    if (!isValidGmail(cleanEmail)) {
      return false;
    }

    return false;
  };

  /* ===================================================
     REFRESH CURRENT USER
  =================================================== */

  const refreshUser = async () => {
    const token =
      getStoredToken();

    if (!token) {
      setUser(null);
      removeCurrentUser();

      return null;
    }

    const currentUser =
      await fetchCurrentUser(token);

    if (currentUser) {
      setUser(currentUser);

      saveCurrentUser(
        currentUser
      );

      window.dispatchEvent(
        new Event("luxoraAuthChanged")
      );

      return currentUser;
    }

    setUser(null);

    removeToken();
    removeCurrentUser();

    window.dispatchEvent(
      new Event("luxoraAuthChanged")
    );

    return null;
  };

  /* ===================================================
     GET ACCESS TOKEN
  =================================================== */

  const getAccessToken = () => {
    return getStoredToken();
  };

  /* ===================================================
     AUTH CONTEXT VALUE
  =================================================== */

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,

    register,
    login,
    logout,

    refreshUser,
    getAccessToken,

    updatePassword,
    userExists,

    isValidGmail,
    isValidPhone,

    API_BASE_URL,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================================
   CUSTOM HOOK
===================================================== */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}

export default AuthProvider;