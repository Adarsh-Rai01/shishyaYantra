/* ========== SHISHYA YANTRA — signup.js ========== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');

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

    // Validate Email
    if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
      showError(emailInput, errEmail, true);
      isValid = false;
    }

    // Validate Password
    if (!passwordInput.value) {
      showError(passwordInput, errPass, true);
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      errPass.textContent = 'Password must be at least 6 characters.';
      showError(passwordInput, errPass, true);
      isValid = false;
    } else {
      errPass.textContent = 'Password is required.';
    }



    if (isValid) {
      // Create user object
      const user = {
        email: emailInput.value.trim(),
        signupDate: new Date().toISOString()
      };

      // Store in localStorage (mock backend)
      localStorage.setItem('shishya_user', JSON.stringify(user));

      // Show toast
      showToast('Welcome to Shishya Yantra. Your student journey starts now.');

      // Show selection modal after a short delay
      setTimeout(() => {
        document.getElementById('selectionModal').classList.add('active');
      }, 1500);
    }
  });

  // ─── Toast Notification ───
  function showToast(msg) {
    let toast = document.getElementById('toast');
    toast.textContent = msg;
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
