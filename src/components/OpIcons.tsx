import { FaEquals } from 'react-icons/fa6';
import { LuAmpersands, LuPlus, LuMinus, LuX, LuDivide } from 'react-icons/lu';
import { HiPlusSm, HiMinusSm } from "react-icons/hi";

export const OrIcon = () => <FaEquals viewBox='15 -60 448 650' style={{ transform: 'rotate(90deg)', width: '1.5em', height: '1.5em' }} />;
export const AndIcon = () => <LuAmpersands style={{ height: '1.5em', width: '1.5em' }} strokeWidth={'1.5'} />;
export const PlusIcon = () => <LuPlus viewBox="0 0 24 25" strokeWidth={'3'} />;
export const MinusIcon = () => <LuMinus viewBox="-0.5 0 25 25" strokeWidth={'3.5'} />;
export const MultiplyIcon = () => <LuX viewBox="0 -1 24 26" strokeWidth={'3'} />;
export const DivideIcon = () => <LuDivide strokeWidth={'2.5'} />;
export const IncIcon = () => (
    <div style={{ display: 'flex', height: '1em', width: '1.5em', gap: '2px' }}>
        <HiPlusSm viewBox='5 5 11.5 10.5' strokeWidth={'.3'} />
        <HiPlusSm viewBox='4 5 11.5 10.5' strokeWidth={'.3'} />
    </div>
);
export const DecIcon = () => (
    <div style={{ display: 'flex', height: '1em', width: '1.5em', gap: '2px' }}>
        <HiMinusSm viewBox='5 5 11.5 10.5' strokeWidth={'.3'} />
        <HiMinusSm viewBox='4 5 11.5 10.5' strokeWidth={'.3'} />
    </div>
);