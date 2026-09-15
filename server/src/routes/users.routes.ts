import { Router, type Response } from 'express'
import { User, toSafeUser } from '../models/User'
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
  const { name, phone, photoUrl } = req.body as { name?: string; phone?: string; photoUrl?: string }
  const updates: Record<string, unknown> = {}
  if (typeof name === 'string' && name.trim()) updates.name = name.trim()
  if (typeof phone === 'string') updates.phone = phone.trim()
  if (typeof photoUrl === 'string') updates.photoUrl = photoUrl

  try {
    const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(toSafeUser({ ...user.toObject(), _id: user._id }))
  } catch {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

export default router