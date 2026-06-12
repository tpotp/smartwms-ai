from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.routers import auth, warehouses, locations, products, inventory, receipts, orders, picking, shipments, alerts, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="SmartWMS AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(warehouses.router, prefix="/api", tags=["Warehouses"])
app.include_router(locations.router, prefix="/api", tags=["Locations"])
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(inventory.router, prefix="/api", tags=["Inventory"])
app.include_router(receipts.router, prefix="/api", tags=["Receipts"])
app.include_router(orders.router, prefix="/api", tags=["Orders"])
app.include_router(picking.router, prefix="/api", tags=["Picking"])
app.include_router(shipments.router, prefix="/api", tags=["Shipments"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


frontend_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        index_path = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404)
else:
    @app.get("/")
    async def root():
        return {"message": "SmartWMS AI API - Frontend not built"}
