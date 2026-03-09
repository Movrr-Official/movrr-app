"use client";

import { Facebook, Heart, Linkedin, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com/movrr", icon: Twitter },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/movrr",
    icon: Linkedin,
  },
  { name: "Facebook", href: "https://facebook.com/movrr", icon: Facebook },
];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full gradient-bg px-10 pb-3 mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
          >
            <span>&copy; {currentYear} Movrr Media</span>
            <span className="hidden md:inline">&bull;</span>
            <span>All rights reserved</span>
            <span className="hidden md:inline">&bull;</span>
            <div className="flex items-center gap-x-1">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-primary fill-current" />
              <span>in The Netherlands</span>
            </div>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4"
            >
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Follow us:
              </span>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{
                      scale: 1.15,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      },
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3"
            >
              <Badge variant="outline" className="text-xs font-mono">
                v1.0.0
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <motion.div
                  className="w-2 h-2 rounded-full bg-success"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <span>All systems operational</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
