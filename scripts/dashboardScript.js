document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const reportButton = document.getElementById('reportButton');
    const reportOverlay = document.getElementById('reportOverlay');
    const closeOverlay = document.getElementById('closeOverlay');
    const reportForm = document.getElementById('reportForm');
    
    // Toggle overlay
    reportButton.addEventListener('click', () => {
      reportOverlay.style.display = 'flex';
    });
    
    closeOverlay.addEventListener('click', () => {
      reportOverlay.style.display = 'none';
    });
    
    // Close overlay when clicking outside content
    reportOverlay.addEventListener('click', (e) => {
      if (e.target === reportOverlay) {
        reportOverlay.style.display = 'none';
      }
    });
  
    // Geolocation
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const getLocationBtn = document.getElementById('getLocation');
  
  getLocationBtn.addEventListener('click', () => {
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
    getLocationBtn.disabled = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          latitudeInput.value = lat;
          longitudeInput.value = lng;
          getLocationBtn.innerHTML = '<i class="fas fa-check-circle"></i> Location Found';
          setTimeout(() => {
            getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Get My Location';
            getLocationBtn.disabled = false;
          }, 2000);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enable location services or enter coordinates manually.');
          getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Get My Location';
          getLocationBtn.disabled = false;
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Get My Location';
      getLocationBtn.disabled = false;
    }
  });

  // Drag and drop file upload
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('photos');
  const previewContainer = document.getElementById('previewContainer');
  const browseButton = dropzone.querySelector('.browse-button');
  
  // Click to select files
  browseButton.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  
  // Handle file selection
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
  });
  
  // Drag and drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropzone.classList.add('active');
  }
  
  function unhighlight() {
    dropzone.classList.remove('active');
  }
  
  dropzone.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }
  
  function handleFiles(files) {
    previewContainer.innerHTML = '';
    
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    
    [...files].forEach(file => {
      if (!file.type.match('image.*')) {
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => {
          previewItem.remove();
          // Remove file from input
          const newFileList = Array.from(fileInput.files).filter(f => f !== file);
          const dataTransfer = new DataTransfer();
          newFileList.forEach(f => dataTransfer.items.add(f));
          fileInput.files = dataTransfer.files;
        });
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);
      };
      
      reader.readAsDataURL(file);
    });
    
    // Update file input
    const dataTransfer = new DataTransfer();
    [...files].forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
  }

  // Form submission
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate coordinates
    if (!latitudeInput.value || !longitudeInput.value) {
      alert('Please get your location first');
      return;
    }
    
    // Validate files
    if (fileInput.files.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    
    const formData = new FormData(reportForm);
    const submitButton = reportForm.querySelector('.submit-button');
    
    // Add coordinates in the required format
    formData.append('coordinates', `${latitudeInput.value},${longitudeInput.value}`);
    
    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/v1/residents/report_waste', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Waste report submitted successfully!');
        reportOverlay.style.display = 'none';
        reportForm.reset();
        previewContainer.innerHTML = '';
        fetchDashboardData();
      } else {
        throw new Error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Submit Report';
    }
  });
  
    // Fetch dashboard data
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/v1/residents/get_resident_dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          updateDashboard(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert(error.message);
      }
    }
  
    // Update dashboard with data
    function updateDashboard(data) {
      document.getElementById('totalReports').textContent = data.totalReports;
      document.getElementById('totalRewards').textContent = data.totalRewards;
      document.getElementById('pendingReports').textContent = data.pendingReports;
  
      const reportsList = document.getElementById('reportsList');
      reportsList.innerHTML = '';
  
      data.recentReports.forEach(report => {
        const reportCard = document.createElement('div');
        reportCard.className = 'report-card';
  
        const reportDate = new Date(report.createdAt);
        const formattedDate = reportDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
  
        let statusClass = '';
        if (report.status.includes('pending')) statusClass = 'status-pending';
        else if (report.status.includes('approved')) statusClass = 'status-approved';
        else if (report.status.includes('assigned')) statusClass = 'status-assigned';
        else if (report.status.includes('useful')) statusClass = 'status-useful';
  
        reportCard.innerHTML = `
          <img src="${report.photoUrl[0]}" alt="Report photo" class="report-image">
          <div class="report-details">
            <div class="report-header">
              <span class="report-type">${report.userReportedType}</span>
              <span class="report-status ${statusClass}">${report.status.replace('_', ' ')}</span>
            </div>
            <div class="report-meta">
              <span>Weight: ${report.approximateWeight} kg</span>
              ${report.assignedZone ? `<span>Zone: ${report.assignedZone}</span>` : ''}
            </div>
            <div class="report-date">Reported on ${formattedDate}</div>
          </div>
        `;
  
        reportsList.appendChild(reportCard);
      });
    }
  
    // Initial data fetch
    fetchDashboardData();
  });