export function filterActivePostingReminders(reminders, openings) {
  const lifecycleVersionByOpeningId = new Map(
    openings.map((opening) => [
      String(opening.id),
      Number(opening.lifecycleVersion ?? 1),
    ])
  );

  return reminders.filter((reminder) => {
    if (reminder.postingType !== 'opening') return false;
    const currentVersion = lifecycleVersionByOpeningId.get(String(reminder.postingId));
    if (currentVersion == null) return false;
    return Number(reminder.lifecycleVersion ?? 1) === currentVersion;
  });
}
