import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Sign in</Button>)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('disables the button when disabled', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('applies the destructive variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button', { name: /delete/i })).toHaveClass('bg-destructive')
  })
})