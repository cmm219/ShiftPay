import { Link } from 'react-router-dom';
import Badge from './Badge';
import Button from './Button';
import { ROLES } from '../utils/constants';

export default function ProfileCard({ worker, onViewProfile }) {
  const {
    id,
    name,
    city,
    photoUrl,
    roles,
    certifications,
    ratingAverage,
    ratingCount,
    demandStatus,
    experienceYears,
    preferredRateMin,
    preferredRateMax,
  } = worker;

  const servSafe = certifications?.find(
    (c) => c.type === 'ServSafe' && c.status === 'verified'
  );

  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle hover:border-accent/30 hover:shadow-lg hover:shadow-accent-glow transition-all duration-300 hover:scale-[1.02] flex flex-col overflow-hidden">
      {/* Photo */}
      <img
        src={photoUrl}
        alt={name}
        className="rounded-lg w-full h-48 object-cover"
      />

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name and city */}
        <div>
          <h3 className="font-semibold text-lg text-text-primary">{name}</h3>
          <p className="text-text-secondary text-sm">{city}</p>
        </div>

        {/* Role badges */}
        <div className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <Badge key={role} type="role" value={role} />
          ))}
        </div>

        {/* ServSafe badge */}
        {servSafe && (
          <Badge type="cert" value="ServSafe" certStatus="verified" />
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm">
          <span>&#11088;</span>
          <span className="text-text-primary font-medium">{ratingAverage}</span>
          <span className="text-text-muted">({ratingCount} reviews)</span>
        </div>

        {/* Demand status */}
        {demandStatus && (
          <Badge type="status" value={demandStatus} />
        )}

        {/* Experience */}
        <p className="text-text-secondary text-sm">
          {experienceYears} {experienceYears === 1 ? 'year' : 'years'} experience
        </p>

        {/* Pay range */}
        <p className="text-text-primary text-sm font-medium">
          ${preferredRateMin}&ndash;${preferredRateMax}/hr
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <Link to={`/worker/${id}`} className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => onViewProfile?.(worker)}
            >
              View Profile
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="flex-1">
            Express Interest
          </Button>
        </div>
      </div>
    </div>
  );
}
