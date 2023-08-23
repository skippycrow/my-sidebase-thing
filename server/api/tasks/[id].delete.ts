import type { H3Event } from 'h3'

export default eventHandler(async (event: H3Event) => {
  const prisma = event.context.prisma
  const { params } = event.context

  const task = await prisma.task.delete({ where: { id: params.id } })

  return task
})
