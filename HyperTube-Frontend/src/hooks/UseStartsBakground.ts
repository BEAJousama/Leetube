import { useEffect, useMemo } from "react";

export const useStarsBackground = () => {
  const createStars = useMemo(
    () => () => {
      const starsContainer = document.getElementById("stars-bg");
      if (!starsContainer) return;

      starsContainer.innerHTML = "";

      const starCount = 150;

      for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        star.className = "star-element";

        const sizes = ["star-small", "star-medium", "star-large"];
        star.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);

        const colors = ["star-cyan", "star-pink", "star-white"];
        star.classList.add(colors[Math.floor(Math.random() * colors.length)]);

        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";
        star.style.animationDelay = Math.random() * 3 + "s";

        starsContainer.appendChild(star);
      }
    },
    [],
  );

  const createParticles = useMemo(
    () => () => {
      const particlesContainer = document.getElementById("particles-bg");
      if (!particlesContainer) return;

      particlesContainer.innerHTML = "";

      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle-element";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";
        particle.style.width = particle.style.height =
          Math.random() * 6 + 2 + "px";
        particle.style.animationDelay = Math.random() * 6 + "s";
        particle.style.animationDuration = Math.random() * 4 + 4 + "s";

        if (i % 2 === 0) {
          particle.style.background = "rgba(8, 217, 214, 0.05)";
        } else {
          particle.style.background = "rgba(255, 46, 99, 0.05)";
          particle.style.animationDelay = Math.random() * 6 - 2 + "s";
        }

        particlesContainer.appendChild(particle);
      }
    },
    [],
  );

  useEffect(() => {
    createStars();
    createParticles();
  }, [createStars, createParticles]);
};
