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
      const storedUserRaw = localStorage.getItem('shishya_user');
      
      if (!storedUserRaw) {
        errEmail.textContent = 'No account found. Please sign up first.';
        showError(emailInput, errEmail, true);
        return;
      }

      const storedUser = JSON.parse(storedUserRaw);

      if (storedUser.email !== enteredEmail) {
        errEmail.textContent = 'Incorrect email address.';
        showError(emailInput, errEmail, true);
        return;
      }

      // Password logic: we accept any password >= 6 chars for the mock
      // In a real app, you would hash and compare.

      // Show toast
      showToast('Login successful. Welcome back!');

      // Show selection modal after a short delay
      setTimeout(() => {
        document.getElementById('selectionModal').classList.add('active');
      }, 1500);
    }
  });

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
