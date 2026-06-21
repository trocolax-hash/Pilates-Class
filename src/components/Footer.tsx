import React from "react";

export default function Footer() {
  return (
    <footer 
      id="app-footer"
      className="w-full bg-luxury-charcoal text-luxury-sand/70 text-xs md:text-sm py-6 px-4 md:px-8 border-t border-luxury-gold/20 text-center"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-sans tracking-wide">
        <p className="text-luxury-sand/50">
          Metodología diseñada por{" "}
          <span className="text-luxury-gold font-medium">David Ortega Benitez</span>.
        </p>
        <p className="text-luxury-sand/50">
          Desarrollo web por{" "}
          <span className="text-luxury-gold font-medium">Raúl Parro Rodríguez</span>.
        </p>
        <p className="text-luxury-sand/30 font-light text-xxs md:text-xs">
          Todos los derechos reservados. &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
