export const getCalculatorAccess = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Calculator access granted',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  })
}
