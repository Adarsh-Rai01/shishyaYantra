/* ========== SHISHYA YANTRA — login.js ========== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  // Input elements
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Error elements
  const errEmail = document.getElementById('errEmail');
  const errPass = document.getElementById('errPass');

  // Utility to show/hide errors
  function showError(input, errorEl, show) {
    if (show) {
      input.classList.add('is-invalid');
      errorEl.style.display = 'block';
    } else {
      input.classList.remove('is-invalid');
      errorEl.style.display = 'none';
    }
  }

  // Basic email regex
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Remove error on input/change
  [emailInput, passwordInput].forEach(el => {
    el.addEventListener('input', function() {
      this.classList.remove('is-invalid');
      if (this.nextElementSibling) {
        this.nextElementSibling.style.display = 'none';
      }
    });
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const enteredEmail = emailInput.value.trim();

    // Validate Email
    if (!enteredEmail || !isValidEmail(enteredEmail)) {
      errEmail.textContent = 'Please enter a valid email.';
      showError(emailInput, errEmail, true);
      isValid = false;
    }

    // Validate Password
    if (!passwordInput.value) {
      errPass.textContent = 'Password is required.';
      showError(passwordInput, errPass, true);
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      errPass.textContent = 'Password must be at least 6 characters.';
      showError(passwordInput, errPass, true);
      isValid = false;
    }

    if (isValid) {
      // Check against localStorage mock backend
      let users = [];
      try {
        users = JSON.parse(localStorage.getItem('shishya_users') || '[]');
      } catch (e) {}

      const storedUserRaw = localStorage.getItem('shishya_user');
      if (storedUserRaw) {
        try {
          const su = JSON.parse(storedUserRaw);
          if (su && su.email && !users.some(u => u.email.toLowerCase() === su.email.toLowerCase())) {
            users.push(su);
          }
        } catch (e) {}
      }

      const matched = users.find(u => u.email.toLowerCase() === enteredEmail.toLowerCase());
      
      if (!matched && users.length > 0) {
        errEmail.textContent = 'Account not found. Please check your email or sign up.';
        showError(emailInput, errEmail, true);
        return;
      } else if (!matched && users.length === 0) {
        // If first-time visitor on deployed site, create their session smoothly
        const newUser = { email: enteredEmail, signupDate: new Date().toISOString() };
        localStorage.setItem('shishya_user', JSON.stringify(newUser));
        localStorage.setItem('shishya_users', JSON.stringify([newUser]));
      } else {
        localStorage.setItem('shishya_user', JSON.stringify(matched));
      }

      // Show toast
      showToast('Login successful. Welcome back!');

      // Show selection modal after a short delay
      setTimeout(() => {
        document.getElementById('selectionModal').classList.add('active');
      }, 1200);
    }
  });

  // Check if returning user is already signed in
  const existingUserRaw = localStorage.getItem('shishya_user');
  if (existingUserRaw) {
    try {
      const existingUser = JSON.parse(existingUserRaw);
      if (existingUser && existingUser.email) {
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
          const banner = document.createElement('div');
          banner.style.cssText = 'margin-bottom:18px;padding:10px 14px;background:rgba(107,255,184,.12);border:1px solid rgba(107,255,184,.3);border-radius:10px;font-size:.82rem;color:#BBE3CE;display:flex;justify-content:space-between;align-items:center;';
          banner.innerHTML = `<span>Logged in as <b>${existingUser.email}</b></span><button type="button" id="btnResume" style="background:var(--primary-d,#355949);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:.78rem;font-weight:600;cursor:pointer;">Resume ↗</button>`;
          formHeader.parentNode.insertBefore(banner, formHeader.nextSibling);
          document.getElementById('btnResume').addEventListener('click', () => {
            document.getElementById('selectionModal').classList.add('active');
          });
        }
      }
    } catch (e) {}
  }

  // ─── Toast Notification ───
  function showToast(msg, isError = false) {
    let toast = document.getElementById('toast');
    toast.textContent = msg;
    
    if (isError) {
      toast.style.background = 'rgba(255,107,107,.9)';
      toast.style.color = '#fff';
      toast.style.borderColor = 'rgba(255,107,107,.2)';
    } else {
      toast.style.background = 'rgba(53,89,73,.9)';
      toast.style.color = '#BBE3CE';
      toast.style.borderColor = 'rgba(187,227,206,.15)';
    }

    toast.style.display = 'block';
    
    // Quick fade in simulation
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    
    requestAnimationFrame(() => {
      toast.style.transition = 'all .3s ease';
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 2000);
  }
});
