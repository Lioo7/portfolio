document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const buttonText = submitButton.querySelector('.button-text');
  const buttonLoader = submitButton.querySelector('.button-loader');

  const showStatus = (message, type) => {
    formStatus.textContent = message;
    formStatus.className = `form-status ${type}`;
    formStatus.removeAttribute('hidden');
  };

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    buttonText.style.display = isLoading ? 'none' : 'inline';
    buttonLoader.style.display = isLoading ? 'inline' : 'none';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
      showStatus('Please fill in all fields.', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showStatus('Please enter a valid email address.', 'error');
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

  // Handle form submission
  form.addEventListener('submit', handleSubmit);

  // Clear status when user starts typing
  form.addEventListener('input', () => {
    if (!formStatus.hasAttribute('hidden')) {
      formStatus.setAttribute('hidden', '');
    }
  });
});