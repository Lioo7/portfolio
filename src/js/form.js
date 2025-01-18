// Form submission tracking and rate limiting
let submissionCount = 0;
let lastSubmissionTime = 0;
const MAX_SUBMISSIONS = 5; // Maximum submissions per hour
const SUBMISSION_WINDOW = 3600000; // 1 hour in milliseconds
const MIN_SUBMISSION_INTERVAL = 1000; // Minimum 1 second between submissions

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const buttonText = submitButton.querySelector('.button-text');
  const buttonLoader = submitButton.querySelector('.button-loader');

  // Reset submission count periodically
  setInterval(() => {
    const now = Date.now();
    if (now - lastSubmissionTime > SUBMISSION_WINDOW) {
      submissionCount = 0;
    }
  }, SUBMISSION_WINDOW);

  // Form status display helper
  const showStatus = (message, type) => {
    formStatus.textContent = message;
    formStatus.className = `form-status ${type}`;
    formStatus.removeAttribute('hidden');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        formStatus.setAttribute('hidden', '');
      }, 5000);
    }
  };

  // Loading state management
  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    buttonText.style.display = isLoading ? 'none' : 'inline';
    buttonLoader.style.display = isLoading ? 'inline' : 'none';
  };

  // Input validation helper
  const validateInput = (input) => {
    const value = input.value.trim();
    const name = input.name;

    switch (name) {
      case 'name':
        return {
          isValid: value.length >= 2,
          message: 'Name must be at least 2 characters long'
        };
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: emailRegex.test(value),
          message: 'Please enter a valid email address'
        };
      case 'message':
        return {
          isValid: value.length >= 10,
          message: 'Message must be at least 10 characters long'
        };
      default:
        return { isValid: true, message: '' };
    }
  };

  // Real-time input validation
  form.addEventListener('input', (e) => {
    const input = e.target;
    const validation = validateInput(input);
    
    // Add visual feedback classes
    input.classList.toggle('is-valid', validation.isValid);
    input.classList.toggle('is-invalid', !validation.isValid);
    
    // Show/hide validation message
    let feedbackElement = input.nextElementSibling;
    if (!feedbackElement?.classList.contains('feedback')) {
      feedbackElement = document.createElement('div');
      feedbackElement.className = 'feedback';
      input.parentNode.insertBefore(feedbackElement, input.nextSibling);
    }
    
    feedbackElement.textContent = validation.isValid ? '' : validation.message;
    feedbackElement.style.display = validation.isValid ? 'none' : 'block';
  });

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check submission rate limiting
    const now = Date.now();
    if (now - lastSubmissionTime < MIN_SUBMISSION_INTERVAL) {
      showStatus('Please wait a moment before submitting again.', 'error');
      return;
    }
    
    if (submissionCount >= MAX_SUBMISSIONS) {
      showStatus('Maximum submission limit reached. Please try again later.', 'error');
      return;
    }

    // Validate all form fields
    const formData = new FormData(form);
    let isValid = true;
    let firstInvalidInput = null;

    for (const [name, value] of formData.entries()) {
      const input = form.elements[name];
      const validation = validateInput(input);
      
      if (!validation.isValid) {
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = input;
        input.classList.add('is-invalid');
      }
    }

    if (!isValid) {
      firstInvalidInput.focus();
      showStatus('Please fill in all fields correctly.', 'error');
      return;
    }

    // Anti-spam check for hidden honeypot field
    if (formData.get('_gotcha')) {
      console.error('Spam submission detected');
      return;
    }

    setLoading(true);
    formStatus.setAttribute('hidden', '');
    
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        showStatus('Thanks for your message! I\'ll get back to you soon.', 'success');
        form.reset();
        submissionCount++;
        lastSubmissionTime = now;
        
        // Remove validation classes
        form.querySelectorAll('.is-valid, .is-invalid').forEach(element => {
          element.classList.remove('is-valid', 'is-invalid');
        });
      } else {
        throw new Error(responseData.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      showStatus(error.message, 'error');
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Form event listeners
  form.addEventListener('submit', handleSubmit);

  // Clear status when user starts typing
  form.addEventListener('input', () => {
    if (!formStatus.hasAttribute('hidden')) {
      formStatus.setAttribute('hidden', '');
    }
  });
});
