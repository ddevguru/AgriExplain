"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Farm {
  id: string
  name: string
  crop: string
  farmer: string
  location: string
  status: string
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", crop: "", farmer: "", location: "" })

  useEffect(() => {
    fetchFarms()
  }, [])

  const fetchFarms = async () => {
    try {
      const res = await fetch("/api/farms")
      if (res.ok) {
        setFarms(await res.json())
      }
    } catch (error) {
      console.error("Error fetching farms:", error)
    }
  }

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setFormData({ name: "", crop: "", farmer: "", location: "" })
        setShowForm(false)
        fetchFarms()
      }
    } catch (error) {
      console.error("Error adding farm:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🌾 Farms Management</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Farm"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleAddFarm} className="space-y-4">
            <Input
              placeholder="Farm Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              placeholder="Crop Type"
              value={formData.crop}
              onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
              required
            />
            <Input
              placeholder="Farmer Name"
              value={formData.farmer}
              onChange={(e) => setFormData({ ...formData, farmer: e.target.value })}
              required
            />
            <Input
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Add Farm
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => (
          <Card key={farm.id} className="p-6">
            <h3 className="font-bold text-lg mb-2">{farm.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                Crop: <span className="font-medium text-gray-900">{farm.crop}</span>
              </p>
              <p>
                Farmer: <span className="font-medium text-gray-900">{farm.farmer}</span>
              </p>
              <p>
                Location: <span className="font-medium text-gray-900">{farm.location}</span>
              </p>
              <p>
                Status: <span className="font-medium text-green-600">●</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
