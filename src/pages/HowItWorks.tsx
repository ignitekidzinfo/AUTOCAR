import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

function HowItWorks() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Responsive background: use "top" for mobile to show key parts of the image
  const backgroundStyle = {
    backgroundImage: "url('/cove.jpg')",
    backgroundSize: "cover",
    backgroundPosition: isMobile ? "top" : "center",
    backgroundRepeat: "no-repeat",
  };

  // Adjusted spring transition for a slightly slower, smoother effect
  const springTransition = {
    type: "spring",
    stiffness: 60,
    damping: 20,
  };

  return (
    <div className="relative w-full min-h-screen" style={backgroundStyle}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* Content */}
      <div className="relative container mx-auto py-20 px-4 text-white">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ ...springTransition, delay: 0 }}
          viewport={{ once: false }}
        >
          {/* LEFT COLUMN (2 boxes) */}
          <div className="flex flex-col space-y-8">
            <motion.div
              className="bg-black bg-opacity-80 rounded-lg p-10"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: 0 }}
              viewport={{ once: false }}
            >
              <div className="text-5xl font-bold mb-4">01</div>
              <h3 className="text-2xl font-semibold mb-2">Choose</h3>
              <p className="text-sm">
                Choose Your Service From Our Wide Range Of Offerings
              </p>
            </motion.div>

            <motion.div
              className="bg-black bg-opacity-80 rounded-lg p-10"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              viewport={{ once: false }}
            >
              <div className="text-5xl font-bold mb-4">02</div>
              <h3 className="text-2xl font-semibold mb-2">Book</h3>
              <p className="text-sm">Make An Appointment With Us</p>
            </motion.div>
          </div>

          {/* CENTER COLUMN (Heading & Subheading) */}
          <div className="flex flex-col items-center justify-center text-center">
            <motion.h2
              className="text-4xl font-bold mb-4"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0 }}
              viewport={{ once: false }}
            >
              How It Works
            </motion.h2>

            <motion.p
              className="text-xl"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              viewport={{ once: false }}
            >
              We Offer Full Service Auto Repair &amp; Maintenance
            </motion.p>
          </div>

          {/* RIGHT COLUMN (2 boxes) */}
          <div className="flex flex-col space-y-8">
            <motion.div
              className="bg-black bg-opacity-80 rounded-lg p-10"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              viewport={{ once: false }}
            >
              <div className="text-5xl font-bold mb-4">03</div>
              <h3 className="text-2xl font-semibold mb-2">Fair Pricing</h3>
              <p className="text-sm">Always Get a Fair Quote</p>
            </motion.div>

            <motion.div
              className="bg-black bg-opacity-80 rounded-lg p-10"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
              viewport={{ once: false }}
            >
              <div className="text-5xl font-bold mb-4">04</div>
              <h3 className="text-2xl font-semibold mb-2">At Your Doorstep</h3>
              <p className="text-sm">
                Get a Door Step Pick up &amp; Drop Service
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default HowItWorks;
