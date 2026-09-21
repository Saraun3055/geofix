import { Router, type Response } from 'express'
import { User, toSafeUser } from '../models/User'
import { Admin, toSafeAdmin } from '../models/Admin'
import { WorkerProfile } from '../models/WorkerProfile'
import type { AuthRequest } from '../middleware/types'

const router = Router()

router.use((req, res, next) => {
  const auth = req as AuthRequest
  if (!auth.user) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }
  next()
})

router.get('/me', async (req, res: Response) => {
  const auth = req as AuthRequest
  try {
    if (auth.user!.role === 'admin') {
      const admin = await Admin.findById(auth.user!.id)
      if (!admin) {
        res.status(404).json({ message: 'Admin not found' })
        return
      }
      res.json(toSafeAdmin({ ...admin.toObject(), _id: admin._id }))
      return
    }
    const user = await User.findById(auth.user!.id)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(toSafeUser({ ...user.toObject(), _id: user._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

router.patch('/me', async (req: AuthRequest, res: Response) => {
  const { name, phone, photoUrl, pincode, area } = req.body as {
    name?: string
    phone?: string
    photoUrl?: string
    pincode?: string
    area?: string
  }
  const updates: Record<string, unknown> = {}
  if (typeof name === 'string' && name.trim()) updates.name = name.trim()
  if (typeof phone === 'string') updates.phone = phone.trim()
  if (typeof photoUrl === 'string') updates.photoUrl = photoUrl
  if (typeof pincode === 'string') updates.pincode = pincode.replace(/\D+/g, '').slice(0, 6)
  if (typeof area === 'string') updates.area = area.trim()

  try {
    if (req.user!.role === 'admin') {
      const admin = await Admin.findByIdAndUpdate(req.user!.id, updates, { new: true })
      if (!admin) {
        res.status(404).json({ message: 'Admin not found' })
        return
      }
      res.json(toSafeAdmin({ ...admin.toObject(), _id: admin._id }))
      return
    }

    const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    if (user.role === 'worker') {
      await WorkerProfile.updateOne({ userId: user._id.toString() }, updates)
    }
    res.json(toSafeUser({ ...user.toObject(), _id: user._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

export default router