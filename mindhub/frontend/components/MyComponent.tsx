import React from 'react';

interface MyComponentProps {
  // Add props as needed
}

export default function MyComponent(props: MyComponentProps) {
  return (
    <div
      style={{
        pointerEvents: "auto",
        color: "rgb(17, 24, 39)",
        backgroundColor: "rgb(249, 250, 251)",
        font: "400 16px/25.6px Inter, system-ui, sans-serif ",
      }}
    >
      <div
        style={{
          fontWeight: "400",
          minHeight: "437.5px",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: "rgb(249, 250, 251)",
            fontWeight: "400",
            minHeight: "437.5px",
            pointerEvents: "auto",
          }}
        >
          <aside
            style={{
              bottom: "0px",
              fontWeight: "400",
              left: "0px",
              position: "fixed",
              top: "0px",
              transitionDuration: "0.3s",
              transitionProperty: "transform",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: "50",
              transform: "matrix(1, 0, 0, 1, 0, 0)",
              pointerEvents: "auto",
              marginRight: "auto",
              backgroundColor: "rgba(18, 46, 51, 1)",
              color: "rgb(255, 255, 255)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontWeight: "400",
                justifyContent: "space-between",
                pointerEvents: "auto",
                padding: "16px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "400",
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgb(255, 255, 255)",
                    borderRadius: "8px",
                    fontWeight: "400",
                    height: "32px",
                    justifyContent: "center",
                    width: "32px",
                    pointerEvents: "auto",
                  }}
                ></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}