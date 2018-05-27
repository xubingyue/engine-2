namespace feng3d
{
    /**
     * 粒子颜色组件
     * @author feng 2017-03-14
     */
    export class ParticleColor extends ParticleComponent
    {
        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            particle.color = new Color4(1, 0, 0, 1).mix(new Color4(0, 1, 0, 1), particle.index / particleSystem.numParticles);
        }
    }
}