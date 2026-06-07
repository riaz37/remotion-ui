export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>RemotionUI</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        The shadcn/ui equivalent for Remotion video development.
      </p>
      <code
        style={{
          background: "#f4f4f5",
          padding: "0.75rem 1.25rem",
          borderRadius: "0.5rem",
          fontSize: "0.9rem",
        }}
      >
        npx remotion-ui@latest add fade-in
      </code>
    </main>
  );
}
