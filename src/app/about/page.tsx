import type { Metadata } from "next";
import "@/styles/pages/about.css";

export const metadata: Metadata = {
  title: "Korean Quest — About",
};

export default function AboutPage() {
  return (
    <main className="container grid">
      <section className="card">
        <h1>About Korean Quest</h1>
        <p>
          <strong>Mission:</strong> make Korean learning engaging, collaborative, and
          accessible through gamified lessons and peer-to-peer support.
        </p>
        <h2>Attribution</h2>
        <p>
          Any third-party videos or assets will be cited on the Resources page. This
          demo uses student-written content.
        </p>
      </section>
      <section className="card">
        <h2>Team</h2>
        <ul>
          <li>Curriculum & Content — Designed by Jiah Lee</li>
          <li>Design & Front-End styling— Jiah Lee and Koji Tanaka</li>
          <li>Front-End interactives & framework — Koji Tanaka</li>
        </ul>
      </section>
    </main>
  );
}
