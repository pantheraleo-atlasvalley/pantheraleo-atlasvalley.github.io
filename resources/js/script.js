// ATLAS VALLEY - EPIC JAVASCRIPT
// Smooth scrolling and navigation
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: "smooth" });
    }
}

// Mobile navigation toggle
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    });

    // Close menu when clicking on a link
    document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
    }));
}

// Gallery filter functionality
const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItems = document.querySelectorAll(".gallery-item");

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove("active"));
        // Add active class to clicked button
        button.classList.add("active");

        const filterValue = button.getAttribute("data-filter");

        galleryItems.forEach(item => {
            if (filterValue === "all" || item.getAttribute("data-category") === filterValue) {
                item.style.display = "block";
                item.style.animation = "fadeInUp 0.6s ease";
            } else {
                item.style.display = "none";
            }
        });
    });
});

// Lightbox functionality
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxDescription = document.getElementById("lightbox-description");
const lightboxClose = document.querySelector(".lightbox-close");

galleryItems.forEach(item => {
    item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const title = item.querySelector("h3").textContent;
        const description = item.querySelector("p").textContent;

        lightboxImg.src = img.src;
        lightboxTitle.textContent = title;
        lightboxDescription.textContent = description;
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
    });
});

// Close lightbox
if (lightboxClose) {
    lightboxClose.addEventListener("click", () => {
        lightbox.classList.remove("active");
        document.body.style.overflow = "auto";
    });
}

// Close lightbox when clicking outside
lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
        lightbox.classList.remove("active");
        document.body.style.overflow = "auto";
    }
});

// Contact form handling with Discord Webhook
const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = formData.get("name");
        const email = formData.get("email");
        const interest = formData.get("interest");
        const message = formData.get("message");

        // Simple validation
        if (!name || !email || !interest || !message) {
            alert("Please fill in all fields!");
            return;
        }

        // Discord Webhook URL
        const webhookUrl = "https://discord.com/api/webhooks/1424834201651511348/kKWm04UjIm3icyxAh0PtgfjjaGlAwo0TtzsnephCfT__CbMZPzm2e2d7jpNE4_4zomBJ";

        // Create Discord embed message
        const payload = {
            embeds: [{
                title: "🌟 New Contact Form Submission",
                color: 0x00ff88,
                fields: [
                    {
                        name: "👤 Name",
                        value: name,
                        inline: true
                    },
                    {
                        name: "📧 Email",
                        value: email,
                        inline: true
                    },
                    {
                        name: "🎯 Interest",
                        value: interest,
                        inline: true
                    },
                    {
                        name: "💬 Message",
                        value: message,
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Atlas Valley Contact Form"
                }
            }]
        };

        const submitBtn = contactForm.querySelector("button[type=submit]");
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "<i class=\"fas fa-spinner fa-spin\"></i> Sending...";
        submitBtn.disabled = true;

        // Send to Discord Webhook
        fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (response.ok) {
                alert("✅ Thank you for your message! We will get back to you soon.");
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            } else {
                throw new Error("Failed to send message");
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
            alert("❌ There was an error sending your message. Please try again.");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("animated");
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener("DOMContentLoaded", () => {
    const animateElements = document.querySelectorAll(".about-card, .project-card, .gallery-item, .contact-item");
    animateElements.forEach(el => {
        el.classList.add("animate-on-scroll");
        observer.observe(el);
    });
});

// Navbar scroll effect
window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 100) {
        navbar.style.background = "rgba(10, 10, 10, 0.98)";
        navbar.style.backdropFilter = "blur(25px)";
    } else {
        navbar.style.background = "rgba(10, 10, 10, 0.95)";
        navbar.style.backdropFilter = "blur(20px)";
    }
});

// Typing effect for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = "";
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Initialize typing effect when page loads
document.addEventListener("DOMContentLoaded", () => {
    const typingElement = document.querySelector(".typing-text");
    if (typingElement) {
        const text = "ATLAS VALLEY";
        typeWriter(typingElement, text, 150);
    }
});

// Particle animation enhancement
function createParticle() {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = "var(--primary-color)";
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    particle.style.opacity = "0.7";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = "100%";
    particle.style.animation = "particleFloat 8s linear forwards";
    
    document.querySelector(".particles").appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 8000);
}

// Create particles periodically
setInterval(createParticle, 500);

// Add particle float animation
const style = document.createElement("style");
style.textContent = `
    @keyframes particleFloat {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth reveal animations
function revealOnScroll() {
    const reveals = document.querySelectorAll(".animate-on-scroll");
    
    reveals.forEach(reveal => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            reveal.classList.add("animated");
        }
    });
}

window.addEventListener("scroll", revealOnScroll);

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log(" Atlas Valley - Epic Website Loaded!");
    console.log(" Powering the Future of Autonomy!");
    
    // Add loading animation
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";
    
    setTimeout(() => {
        document.body.style.opacity = "1";
    }, 100);
});

// ===========================================
// VIDEO GALLERY FUNCTIONALITY
// ===========================================

// Initialize video controls when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeVideoControls();
});

function initializeVideoControls() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        const video = item.querySelector('.gallery-video');
        const playButton = item.querySelector('.play-button');
        const playPauseBtn = item.querySelector('.play-pause-btn');
        const muteBtn = item.querySelector('.mute-btn');
        const progressBar = item.querySelector('.progress-bar');
        const videoTime = item.querySelector('.video-time');
        const videoProgress = item.querySelector('.video-progress');
        
        if (!video) return;
        
        // Play/Pause functionality
        function togglePlayPause() {
            if (video.paused) {
                video.play();
                item.classList.add('playing');
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                item.classList.remove('playing');
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        }
        
        // Play button click
        if (playButton) {
            playButton.addEventListener('click', togglePlayPause);
        }
        
        // Play/Pause button
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }
        
        // Mute/Unmute functionality
        if (muteBtn) {
            muteBtn.addEventListener('click', function() {
                video.muted = !video.muted;
                muteBtn.innerHTML = video.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : 
                    '<i class="fas fa-volume-up"></i>';
            });
        }
        
        // Progress bar functionality
        if (videoProgress && progressBar) {
            videoProgress.addEventListener('click', function(e) {
                const rect = videoProgress.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                video.currentTime = percentage * video.duration;
            });
        }
        
        // Update progress bar and time
        video.addEventListener('timeupdate', function() {
            if (video.duration) {
                const percentage = (video.currentTime / video.duration) * 100;
                progressBar.style.width = percentage + '%';
                
                // Update time display
                const currentTime = formatTime(video.currentTime);
                const duration = formatTime(video.duration);
                videoTime.textContent = `${currentTime} / ${duration}`;
            }
        });
        
        // Video ended
        video.addEventListener('ended', function() {
            item.classList.remove('playing');
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            progressBar.style.width = '0%';
            videoTime.textContent = `0:00 / ${formatTime(video.duration)}`;
        });
        
        // Video loading states
        video.addEventListener('loadstart', function() {
            item.querySelector('.video-container').classList.add('loading');
        });
        
        video.addEventListener('canplay', function() {
            item.querySelector('.video-container').classList.remove('loading');
        });
        
        // Pause other videos when one starts playing
        video.addEventListener('play', function() {
            videoItems.forEach(otherItem => {
                if (otherItem !== item) {
                    const otherVideo = otherItem.querySelector('.gallery-video');
                    if (otherVideo && !otherVideo.paused) {
                        otherVideo.pause();
                        otherItem.classList.remove('playing');
                        const otherPlayBtn = otherItem.querySelector('.play-pause-btn');
                        if (otherPlayBtn) {
                            otherPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
                        }
                    }
                }
            });
        });
        
        // Keyboard controls
        item.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                togglePlayPause();
            }
        });
        
        // Make video container focusable for keyboard navigation
        item.setAttribute('tabindex', '0');
    });
}

// Format time helper function
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Enhanced gallery filter to include videos
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    item.style.animation = 'fadeInUp 0.6s ease';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
});

// Video intersection observer for performance
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target.querySelector('.gallery-video');
        if (video) {
            if (entry.isIntersecting) {
                // Video is in viewport, can preload
                video.preload = 'metadata';
            } else {
                // Video is out of viewport, pause if playing
                if (!video.paused) {
                    video.pause();
                    const item = entry.target;
                    item.classList.remove('playing');
                    const playBtn = item.querySelector('.play-pause-btn');
                    if (playBtn) {
                        playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    }
                }
            }
        }
    });
}, { threshold: 0.5 });

// Observe all video items
document.addEventListener('DOMContentLoaded', function() {
    const videoItems = document.querySelectorAll('.video-item');
    videoItems.forEach(item => {
        videoObserver.observe(item);
    });
});
