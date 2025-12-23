interface TipCardProps {
  name: string;
  tip: string;
}

export function TipCard({ name, tip }: TipCardProps) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{
        background: "rgba(0, 133, 111, 0.05)",
        borderLeft: "4px solid #00856F",
      }}
    >
      <h3
        className="mb-2"
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#00453A",
        }}
      >
        {name}
      </h3>
      <p
        style={{
          fontSize: "16px",
          color: "#546E7A",
          lineHeight: "24px",
        }}
      >
        {tip}
      </p>
    </div>
  );
}
